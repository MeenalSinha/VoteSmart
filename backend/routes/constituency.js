const express = require('express');
const router = express.Router();
const { explainConstituencyData } = require('../services/aiService');
const data = require('../data/constituencies.json');

router.get('/locations', (req, res) => {
  res.json({
    success: true,
    data: {
      countries: data.countries,
      states: data.states,
      cities: data.cities,
    },
  });
});

router.get('/search', (req, res) => {
  const { city, state } = req.query;
  let results = data.constituencies;

  if (state) results = results.filter((c) => c.state.toLowerCase() === state.toLowerCase());
  if (city) results = results.filter((c) => c.name.toLowerCase().includes(city.toLowerCase()));

  const simplified = results.map((c) => ({
    id: c.id,
    name: c.name,
    state: c.state,
    currentMP: c.currentMP,
    party: c.party,
    totalVoters: c.totalVoters,
    lastTurnout: c.elections[0]?.turnout,
  }));

  res.json({ success: true, data: simplified });
});

router.get('/:id', (req, res) => {
  const constituency = data.constituencies.find((c) => c.id === req.params.id);
  if (!constituency) {
    return res.status(404).json({ error: 'Constituency not found' });
  }
  res.json({ success: true, data: constituency });
});

router.post('/:id/insights', async (req, res, next) => {
  try {
    const constituency = data.constituencies.find((c) => c.id === req.params.id);
    if (!constituency) {
      return res.status(404).json({ error: 'Constituency not found' });
    }

    const { language = 'en' } = req.body;
    const insights = await explainConstituencyData(
      {
        name: constituency.name,
        elections: constituency.elections,
        totalVoters: constituency.totalVoters,
        demographics: constituency.demographics,
      },
      language,
      req.requestId
    );

    res.json({ success: true, data: insights });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
