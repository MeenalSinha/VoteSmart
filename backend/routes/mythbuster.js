const express = require('express');
const router = express.Router();
const { bustMyth } = require('../services/aiService');

router.post('/check', async (req, res, next) => {
  try {
    const { claim, language = 'en' } = req.body;

    if (!claim || typeof claim !== 'string' || claim.trim().length < 10) {
      return res.status(400).json({ error: 'Please provide a claim of at least 10 characters' });
    }
    if (claim.length > 500) {
      return res.status(400).json({ error: 'Claim must be under 500 characters' });
    }

    const result = await bustMyth(claim.trim(), language, req.requestId);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

router.get('/examples', (req, res) => {
  res.json({
    success: true,
    data: [
      'You need to be above 21 to vote in India',
      'EVMs can be hacked remotely using Bluetooth',
      'You cannot vote if you do not have a Voter ID card',
      'Voting is compulsory in India',
      'The Election Commission is controlled by the government in power'
    ]
  });
});

module.exports = router;
