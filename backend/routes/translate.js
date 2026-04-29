/**
 * translate.js — Translation route
 * Exposes Google Cloud Translation API to the frontend.
 * Used to translate UI text and user-submitted content between English and Hindi.
 */

const express = require('express');
const router = express.Router();
const { translateText, detectLanguage } = require('../services/translateService');

/**
 * POST /api/translate
 * Body: { text: string, targetLanguage: 'en' | 'hi' }
 * Returns: { translatedText: string, detectedSourceLanguage: string }
 */
router.post('/', async (req, res, next) => {
  try {
    const { text, targetLanguage = 'en' } = req.body;

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({ error: 'text is required' });
    }
    if (text.length > 2000) {
      return res.status(400).json({ error: 'text must be under 2000 characters' });
    }
    if (!['en', 'hi'].includes(targetLanguage)) {
      return res.status(400).json({ error: 'targetLanguage must be "en" or "hi"' });
    }

    const [translated, detected] = await Promise.all([
      translateText(text.trim(), targetLanguage, req.requestId),
      detectLanguage(text.trim(), req.requestId),
    ]);

    res.json({
      success: true,
      data: {
        translatedText: translated,
        detectedSourceLanguage: detected.language,
        targetLanguage,
        confidence: detected.confidence,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/translate/detect
 * Query: ?text=some+text
 * Returns detected language and confidence
 */
router.get('/detect', async (req, res, next) => {
  try {
    const { text } = req.query;
    if (!text || text.length < 2) {
      return res.status(400).json({ error: 'text query param required (min 2 chars)' });
    }
    const detection = await detectLanguage(text, req.requestId);
    res.json({ success: true, data: detection });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
