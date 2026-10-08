// src/cli/index.js
// The terminal app. Asks questions, calls matchService, prints results. No SQL and no maths here.
const matchService = require('../services/matchService');
const jobModel = require('../models/jobModel');
const candidateModel = require('../models/candidateModel');
const prompts = require('./prompts');
const display = require('./display');

// Ctrl+C leaves politely.
process.on('SIGINT', () => {
  display.showGoodbye();
  process.exit(0);
});

// Job to candidates: pick a job, show the ranking.
async function runJobSearch(preferences) {
  const jobId = await prompts.askJob(jobModel.getAllJobs());
  if (jobId === null) return;
  const result = matchService.getMatchesForJob(jobId, preferences);
  display.showJobMatches(result, preferences);
  const next = await prompts.askNext();
  if (next === 'all') display.showMatchCards(result.matches.slice(3), 'candidate', 'More explanations');
}

// Candidate to jobs: pick a candidate, show the ranking.
async function runCandidateSearch(preferences) {
  const candidateId = await prompts.askCandidate(candidateModel.getAllCandidates());
  if (candidateId === null) return;
  const result = matchService.getMatchesForCandidate(candidateId, preferences);
  display.showCandidateMatches(result, preferences);
  const next = await prompts.askNext();
  if (next === 'all') display.showMatchCards(result.matches.slice(3), 'job', 'More explanations');
}

// Onboarding, then the menu loop.
async function main() {
  display.showBanner();
  let preferences = await prompts.askPreferences();
  display.showPreferences(preferences);
  let running = true;
  while (running) {
    const choice = await prompts.askMainMenu();
    if (choice === 'job') {
      await runJobSearch(preferences);
    } else if (choice === 'candidate') {
      await runCandidateSearch(preferences);
    } else if (choice === 'preferences') {
      preferences = await prompts.askPreferences();
      display.showPreferences(preferences);
    } else if (choice === 'how') {
      display.showHowScoringWorks();
    } else {
      running = false;
    }
  }
  display.showGoodbye();
}

// An unexpected error prints one red line and exits with code 1, no stack trace.
main().catch((error) => {
  console.error('Something went wrong: ' + error.message);
  process.exit(1);
});
