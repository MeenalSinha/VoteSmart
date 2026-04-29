/**
 * translateService.js — Google Cloud Translation API integration
 *
 * Uses the official @google-cloud/translate v2 API to provide
 * on-demand translation of text between English and Hindi.
 *
 * The client authenticates via GOOGLE_APPLICATION_CREDENTIALS env var
 * (service account JSON), or falls back to Application Default Credentials
 * when running on Google Cloud Run (the recommended approach for GCP-native apps).
 */

const { Translate } = require('@google-cloud/translate').v2;
const logger = require('./loggerService');

// Instantiate the Google Cloud Translation client.
// On Cloud Run, credentials are picked up automatically from the service account.
const translate = new Translate({
  projectId: process.env.GOOGLE_CLOUD_PROJECT || 'votesmart-ai-voting-companion'
});

const SUPPORTED_LANGUAGES = {
  en: 'English',
  hi: 'Hindi'
};

/**
 * Translate text to the target language using Google Cloud Translation API.
 *
 * @param {string}  text        - The text to translate
 * @param {string}  targetLang  - Target language code ('en' or 'hi')
 * @param {string}  requestId   - Request tracing ID for logging
 * @returns {Promise<string>}   - Translated text
 */
async function translateText(text, targetLang = 'en', requestId = 'unknown') {
  if (!text || typeof text !== 'string') return text;
  if (!SUPPORTED_LANGUAGES[targetLang]) return text;

  // Skip translation if text is already short or just punctuation
  if (text.trim().length < 3) return text;

  try {
    logger.info('Google Cloud Translation request', {
      requestId,
      targetLang,
      textLength: text.length
    });

    const [translation] = await translate.translate(text, targetLang);

    logger.info('Google Cloud Translation success', {
      requestId,
      targetLang,
      originalLength: text.length,
      translatedLength: translation.length
    });

    return translation;
  } catch (err) {
    // Translation is a best-effort enhancement — if it fails, return original text
    logger.warn('Google Cloud Translation failed, returning original', {
      requestId,
      targetLang,
      message: err.message
    });
    return text;
  }
}

/**
 * Detect the language of input text.
 * Returns a language code (e.g., 'en', 'hi') and a confidence score.
 */
async function detectLanguage(text, requestId = 'unknown') {
  try {
    const [detection] = await translate.detect(text);
    logger.info('Language detected', { requestId, language: detection.language, confidence: detection.confidence });
    return detection;
  } catch (err) {
    logger.warn('Language detection failed', { requestId, message: err.message });
    return { language: 'en', confidence: 0 };
  }
}

module.exports = { translateText, detectLanguage };
