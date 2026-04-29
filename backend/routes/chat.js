const express = require('express');
const router = express.Router();
const { chatWithCoach } = require('../services/aiService');

router.post('/message', async (req, res, next) => {
  try {
    const { messages, userContext, language = 'en' } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'messages must be a non-empty array' });
    }
    if (messages.length > 50) {
      return res.status(400).json({ error: 'Conversation history too long (max 50 messages)' });
    }
    for (const msg of messages) {
      if (!['user', 'assistant'].includes(msg.role)) {
        return res.status(400).json({ error: `Invalid message role: '${msg.role}'` });
      }
      if (!msg.content || typeof msg.content !== 'string' || msg.content.trim().length === 0) {
        return res.status(400).json({ error: 'Each message must have non-empty string content' });
      }
    }
    if (messages[0].role !== 'user') {
      return res.status(400).json({ error: 'First message must be from the user' });
    }

    const reply = await chatWithCoach(messages, userContext || {}, language, req.requestId);
    res.json({ success: true, data: { reply, timestamp: new Date().toISOString() } });
  } catch (error) {
    next(error);
  }
});

router.get('/suggestions', (req, res) => {
  const { language = 'en' } = req.query;
  const suggestions = {
    en: [
      'How do I register to vote?',
      'What documents do I need at the polling booth?',
      'What is NOTA and when should I use it?',
      'How does the EVM work?',
      'What is the Model Code of Conduct?',
      'Can I vote if I moved to a new city?',
      'What happens if my name is not on the voter list?',
      'How can I check my voter registration status?'
    ],
    hi: [
      'मतदाता पंजीकरण कैसे करें?',
      'मतदान केंद्र पर कौन से दस्तावेज़ चाहिए?',
      'NOTA क्या है?',
      'EVM कैसे काम करता है?',
      'आदर्श आचार संहिता क्या है?'
    ]
  };
  res.json({ success: true, data: suggestions[language] || suggestions.en });
});

module.exports = router;
