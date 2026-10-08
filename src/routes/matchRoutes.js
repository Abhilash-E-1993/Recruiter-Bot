// src/routes/matchRoutes.js
// URL to controller mapping. The only two endpoints of the API.
const express = require('express');
const controller = require('../controllers/matchController');

const router = express.Router();

router.get('/jobs/:id/matches', controller.getJobMatches);
router.get('/candidates/:id/matches', controller.getCandidateMatches);

module.exports = router;
