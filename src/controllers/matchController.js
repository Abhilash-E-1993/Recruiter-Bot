// src/controllers/matchController.js
// Reads the request, calls the service, sends JSON. No SQL and no maths here.
const matchService = require('../services/matchService');
const { DEFAULT_PREFERENCES } = require('../services/scoring');

// The optional query parameters and the values each one accepts.
const ALLOWED = {
  priority: ['none', 'skills', 'experience'],
  overqualification: ['penalize', 'allow'],
  availability: ['default', 'include_low', 'include_fair'],
};

// Turns '5' into 5. Returns null if it is not a positive whole number.
function parseId(text) {
  const id = Number(text);
  return Number.isInteger(id) && id > 0 ? id : null;
}

// Reads the optional query parameters and checks each value.
function parsePreferences(query) {
  const preferences = { ...DEFAULT_PREFERENCES };
  for (const key of Object.keys(ALLOWED)) {
    if (query[key] === undefined) continue;
    if (!ALLOWED[key].includes(query[key])) {
      return { error: key + ' must be one of: ' + ALLOWED[key].join(', ') };
    }
    preferences[key] = query[key];
  }
  return { preferences };
}

// GET /jobs/:id/matches (add includeUnavailable=true to also list Not looking candidates)
function getJobMatches(req, res) {
  try {
    const id = parseId(req.params.id);
    if (id === null) return res.status(400).json({ error: 'id must be a positive whole number' });
    const parsed = parsePreferences(req.query);
    if (parsed.error) return res.status(400).json({ error: parsed.error });
    const includeUnavailable = req.query.includeUnavailable === 'true';
    const result = matchService.getMatchesForJob(id, parsed.preferences, includeUnavailable);
    if (result === null) return res.status(404).json({ error: 'Job ' + id + ' not found' });
    res.json({ preferences: parsed.preferences, includeUnavailable, ...result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Something went wrong' });
  }
}

// GET /candidates/:id/matches (same steps, other direction)
function getCandidateMatches(req, res) {
  try {
    const id = parseId(req.params.id);
    if (id === null) return res.status(400).json({ error: 'id must be a positive whole number' });
    const parsed = parsePreferences(req.query);
    if (parsed.error) return res.status(400).json({ error: parsed.error });
    const result = matchService.getMatchesForCandidate(id, parsed.preferences);
    if (result === null) return res.status(404).json({ error: 'Candidate ' + id + ' not found' });
    res.json({ preferences: parsed.preferences, ...result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Something went wrong' });
  }
}

module.exports = { getJobMatches, getCandidateMatches };
