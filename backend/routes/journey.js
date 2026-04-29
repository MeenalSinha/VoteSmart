const express = require('express');
const router = express.Router();
const { generateJourney } = require('../services/aiService');

router.post('/generate', async (req, res, next) => {
  try {
    const { location, voterType, language = 'en' } = req.body;

    if (!location || typeof location !== 'string' || location.trim().length < 2) {
      return res.status(400).json({ error: 'location is required (minimum 2 characters)' });
    }
    if (!voterType || typeof voterType !== 'string') {
      return res.status(400).json({ error: 'voterType is required' });
    }

    const journey = await generateJourney(
      location.trim(),
      voterType.trim(),
      language,
      req.requestId
    );
    res.json({ success: true, data: journey });
  } catch (error) {
    next(error);
  }
});

router.get('/voter-types', (req, res) => {
  res.json({
    success: true,
    data: {
      types: [
        {
          id: 'first-time',
          label: 'First-Time Voter',
          description: 'Voting for the very first time',
        },
        {
          id: 'student',
          label: 'Student Voter',
          description: 'Currently enrolled in school or college',
        },
        { id: 'senior', label: 'Senior Voter', description: 'Above 60 years of age' },
        { id: 'migrant', label: 'Migrant Worker', description: 'Living away from hometown' },
        { id: 'pwd', label: 'Person with Disability', description: 'Requires special assistance' },
        { id: 'regular', label: 'Regular Voter', description: 'Voted in previous elections' },
      ],
    },
  });
});

module.exports = router;
