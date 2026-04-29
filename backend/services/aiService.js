/**
 * aiService.js
 * All Anthropic Claude AI integrations.
 *
 * Production features:
 *  - LRU cache with per-function TTLs (avoids repeat API calls)
 *  - Exponential backoff retry (handles transient 529/500 errors)
 *  - Prompt injection defense (sanitize user inputs before interpolation)
 *  - Robust JSON extraction (handles markdown fences, trailing commas)
 *  - Response shape validation (catches malformed AI output before it reaches routes)
 *  - Structured logging with request context
 */

const Anthropic = require('@anthropic-ai/sdk');
const { buildKey, get, set, HOUR } = require('./cacheService');
const logger = require('./loggerService');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL = 'claude-sonnet-4-20250514';

// ── Retry configuration ────────────────────────────────────────────────────
const MAX_RETRIES = 3;
const RETRY_BASE_MS = 800; // doubles each attempt: 800, 1600, 3200

/**
 * Call the Anthropic API with exponential backoff retry on transient errors.
 * Retries on: network errors, 429 (rate limit), 529 (overloaded), 500/503.
 */
async function callWithRetry(params, requestId, attempt = 1) {
  try {
    return await client.messages.create(params);
  } catch (err) {
    const isRetryable =
      !err.status ||                    // network-level error
      err.status === 429 ||             // rate limited
      err.status === 529 ||             // Anthropic overloaded
      err.status >= 500;                // server-side error

    if (isRetryable && attempt < MAX_RETRIES) {
      const delayMs = RETRY_BASE_MS * Math.pow(2, attempt - 1);
      logger.warn('Anthropic API transient error, retrying', {
        requestId, attempt, delayMs, status: err.status, message: err.message
      });
      await new Promise(r => setTimeout(r, delayMs));
      return callWithRetry(params, requestId, attempt + 1);
    }

    // Not retryable or exhausted retries — rethrow with context
    logger.error('Anthropic API call failed', {
      requestId, attempt, status: err.status, message: err.message
    });
    throw err;
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * Extract and parse JSON from an AI response string.
 * Handles: markdown fences, leading prose, trailing commas (common LLM quirks).
 */
function extractJSON(text) {
  // Strip markdown code fences
  let cleaned = text.replace(/```(?:json)?\s*([\s\S]*?)```/g, '$1').trim();

  // Find the outermost {...} block
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('AI response contained no JSON object');

  // Strip trailing commas before } or ] (invalid JSON but common in LLM output)
  const jsonStr = match[0].replace(/,\s*([}\]])/g, '$1');

  try {
    return JSON.parse(jsonStr);
  } catch (e) {
    throw new Error(`AI returned malformed JSON: ${e.message}`);
  }
}

/**
 * Sanitize user-supplied strings before interpolating into prompts.
 * Strips newlines and control chars to prevent prompt injection.
 */
function sanitize(str, maxLen = 200) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/\r\n/g, ' ')           // CRLF pair -> single space (prevents double-space bug)
    .replace(/[\r\n\t]/g, ' ')      // remaining lone CR, LF, TAB -> space
    .replace(/  +/g, ' ')              // collapse consecutive spaces into one
    .replace(/[^\x20-\x7E\u0900-\u097F\u0980-\u09FF]/g, '')
    .substring(0, maxLen)
    .trim();
}

function resolveLanguage(lang) {
  return lang === 'hi' ? 'hi' : 'en';
}

// ── generateJourney ────────────────────────────────────────────────────────

async function generateJourney(location, voterType, language = 'en', requestId = 'unknown') {
  const lang = resolveLanguage(language);
  const safeLocation = sanitize(location, 150);
  const safeVoterType = sanitize(voterType, 50);

  // Cache key — same location + voterType + lang → same response
  const cacheKey = buildKey('journey', safeLocation, safeVoterType, lang);
  const cached = get(cacheKey);
  if (cached) {
    logger.info('Journey cache hit', { requestId, cacheKey });
    return cached;
  }

  logger.info('Generating journey via AI', { requestId, safeLocation, safeVoterType, lang });

  const langInstruction = lang === 'hi'
    ? 'Respond entirely in Hindi (Devanagari script).'
    : 'Respond in English.';

  const response = await callWithRetry({
    model: MODEL,
    max_tokens: 1500,
    messages: [{
      role: 'user',
      content: `${langInstruction}
You are an Indian election information assistant. Generate a detailed, personalized step-by-step voting guide for a ${safeVoterType} voter in ${safeLocation}.
Return ONLY valid JSON — no prose, no markdown — in this exact structure:
{
  "steps": [
    {
      "id": 1,
      "title": "Step title",
      "description": "Detailed description",
      "checklist": ["item1", "item2", "item3"],
      "tip": "A helpful tip for this step"
    }
  ],
  "summary": "A 2-sentence personalized summary for this voter",
  "urgentNote": "One critical thing this voter must remember"
}
Generate exactly 4 steps: 1) Voter Registration, 2) Pre-Election Preparation, 3) Documents Required, 4) Polling Day Instructions.`
    }]
  }, requestId);

  const result = extractJSON(response.content[0].text);

  if (!Array.isArray(result.steps) || result.steps.length === 0) {
    throw new Error('AI returned journey with no steps');
  }

  // Cache for 2 hours — election info is stable within a day
  set(cacheKey, result, 2 * HOUR);
  logger.info('Journey generated and cached', { requestId, steps: result.steps.length });

  return result;
}

// ── explainConstituencyData ────────────────────────────────────────────────

async function explainConstituencyData(data, language = 'en', requestId = 'unknown') {
  const lang = resolveLanguage(language);

  const cacheKey = buildKey('constituency-insights', data.name || '', lang);
  const cached = get(cacheKey);
  if (cached) {
    logger.info('Constituency insights cache hit', { requestId, cacheKey });
    return cached;
  }

  logger.info('Generating constituency insights via AI', { requestId, name: data.name, lang });

  const langInstruction = lang === 'hi'
    ? 'Respond entirely in Hindi (Devanagari script).'
    : 'Respond in English.';

  const response = await callWithRetry({
    model: MODEL,
    max_tokens: 500,
    messages: [{
      role: 'user',
      content: `${langInstruction}
You are an Indian election data analyst. Explain this constituency election data in 3 simple, insightful points for an average voter. Focus on trends, winning margins, and turnout changes.
Data: ${JSON.stringify(data)}
Return ONLY valid JSON — no prose, no markdown:
{
  "insights": ["insight sentence 1", "insight sentence 2", "insight sentence 3"],
  "trend": "Rising",
  "highlight": "The single most interesting fact in one sentence"
}
The trend field must be exactly one of: "Rising", "Falling", "Stable".`
    }]
  }, requestId);

  const result = extractJSON(response.content[0].text);

  if (!Array.isArray(result.insights) || result.insights.length === 0) {
    throw new Error('AI returned insights with invalid shape');
  }

  const validTrends = ['Rising', 'Falling', 'Stable'];
  if (!validTrends.includes(result.trend)) result.trend = 'Stable';

  // Cache constituency insights for 4 hours
  set(cacheKey, result, 4 * HOUR);
  logger.info('Constituency insights cached', { requestId, name: data.name });

  return result;
}

// ── chatWithCoach ──────────────────────────────────────────────────────────

async function chatWithCoach(messages, userContext, language = 'en', requestId = 'unknown') {
  // Chat is NOT cached — each conversation is unique and stateful
  const lang = resolveLanguage(language);

  const safeContext = {
    location: sanitize(userContext.location || '', 100),
    voterType: sanitize(userContext.voterType || '', 50)
  };

  const langInstruction = lang === 'hi'
    ? 'Always respond in Hindi (Devanagari script).'
    : 'Always respond in English.';

  const systemPrompt = `You are an AI Election Coach — a friendly, knowledgeable guide helping Indian voters understand the democratic process. ${langInstruction}
Voter context: location=${safeContext.location || 'India'}, voterType=${safeContext.voterType || 'general'}.
Rules:
- Keep answers concise (2-4 sentences maximum)
- Use simple, clear language
- Be factual and strictly non-partisan
- Reference the voter's location when directly relevant
- Only answer questions related to elections, voting, civic processes, and democracy
- If asked about unrelated topics, politely redirect to election topics`;

  // Validate and sanitize messages
  const validatedMessages = messages
    .filter(m => ['user', 'assistant'].includes(m.role))
    .filter(m => typeof m.content === 'string' && m.content.trim().length > 0)
    .map(m => ({ role: m.role, content: m.content.substring(0, 1000).trim() }));

  // Enforce strict alternation (Anthropic API requirement)
  const alternated = [];
  let lastRole = null;
  for (const msg of validatedMessages) {
    if (msg.role !== lastRole) {
      alternated.push(msg);
      lastRole = msg.role;
    }
  }

  if (alternated.length === 0 || alternated[0].role !== 'user') {
    throw new Error('Conversation must start with a user message');
  }

  logger.info('Chat request', { requestId, turns: alternated.length, lang });

  const response = await callWithRetry({
    model: MODEL,
    max_tokens: 500,
    system: systemPrompt,
    messages: alternated
  }, requestId);

  return response.content[0].text;
}

// ── bustMyth ──────────────────────────────────────────────────────────────

async function bustMyth(claim, language = 'en', requestId = 'unknown') {
  const lang = resolveLanguage(language);
  const safeClaim = sanitize(claim, 500);

  // Cache myth results — same claim should give consistent answer
  const cacheKey = buildKey('myth', safeClaim, lang);
  const cached = get(cacheKey);
  if (cached) {
    logger.info('MythBuster cache hit', { requestId, cacheKey });
    return cached;
  }

  logger.info('MythBuster AI call', { requestId, claimLength: safeClaim.length, lang });

  const langInstruction = lang === 'hi'
    ? 'Respond entirely in Hindi (Devanagari script).'
    : 'Respond in English.';

  const response = await callWithRetry({
    model: MODEL,
    max_tokens: 700,
    messages: [{
      role: 'user',
      content: `${langInstruction}
You are an Indian election fact-checker. Analyze the following claim about Indian elections or voting for accuracy.
Claim to analyze: <claim>${safeClaim}</claim>
Return ONLY valid JSON — no prose, no markdown:
{
  "verdict": "True",
  "confidence": 85,
  "explanation": "2-3 sentence factual explanation",
  "context": "Important additional context voters should know",
  "sources": ["Election Commission of India", "Representation of the People Act 1950"]
}
The verdict field must be exactly one of: "True", "False", "Misleading", "Partially True".
The confidence field must be an integer between 0 and 100.`
    }]
  }, requestId);

  const result = extractJSON(response.content[0].text);

  const validVerdicts = ['True', 'False', 'Misleading', 'Partially True'];
  if (!validVerdicts.includes(result.verdict)) result.verdict = 'Misleading';

  if (typeof result.confidence !== 'number') {
    result.confidence = parseInt(result.confidence, 10) || 70;
  }
  result.confidence = Math.max(0, Math.min(100, result.confidence));

  // Cache myth results for 4 hours
  set(cacheKey, result, 4 * HOUR);
  logger.info('MythBuster result cached', { requestId, verdict: result.verdict });

  return result;
}

module.exports = { generateJourney, explainConstituencyData, chatWithCoach, bustMyth };
