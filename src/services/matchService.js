// src/services/matchService.js
// One match run, both directions: job -> ranked candidates, candidate -> ranked jobs.
const candidateModel = require('../models/candidateModel');
const jobModel = require('../models/jobModel');
const { scoreMatch, isVisible, DEFAULT_PREFERENCES } = require('./scoring');
const { buildReason } = require('./reason');

// Availability order used as a tie-breaker (Immediate beats 2 weeks beats Not looking).
const AVAILABILITY_RANK = { 'Immediate': 2, '2 weeks': 1, 'Not looking': 0 };

// Scores one candidate against one job and returns one match object.
function buildMatch(job, candidate, preferences) {
  const result = scoreMatch(
    {
      requiredSkills: job.skills,
      candidateSkills: candidate.skills,
      requiredYears: job.minExperienceYears,
      candidateYears: candidate.experienceYears,
      availability: candidate.availability,
      flags: candidate.flags,
    },
    preferences
  );
  const skillMatchPercentage = Number(result.skillPercentage.toFixed(1));
  // Flags go out score high to low, then name A to Z.
  const flags = [...candidate.flags].sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
  return {
    job: { id: job.id, title: job.title, minExperienceYears: job.minExperienceYears },
    candidate: {
      id: candidate.id,
      name: candidate.name,
      experienceYears: candidate.experienceYears,
      availability: candidate.availability,
    },
    score: result.finalScore,
    skillMatchPercentage,
    matchedSkills: result.matchedSkills,
    missingSkills: result.missingSkills,
    experienceFit: result.experienceFit,
    flags,
    breakdown: {
      skillPoints: result.skillPoints,
      experiencePoints: result.experiencePoints,
      availabilityMultiplier: Number(result.availabilityMultiplier.toFixed(4)),
      flagScore: result.flagScore,
    },
    reason: buildReason({
      skillPercentage: skillMatchPercentage,
      requiredSkillCount: job.skills.length,
      experienceFit: result.experienceFit,
      availability: candidate.availability,
      flags,
    }),
  };
}

// Sorts best first and adds rank 1, 2, 3 ... (getId returns the id used as the last tie-breaker).
// Tie-break order: score, skill match %, experience points, availability, then lower id.
function sortAndRank(matches, getId) {
  matches.sort(
    (a, b) =>
      b.score - a.score ||
      b.skillMatchPercentage - a.skillMatchPercentage ||
      b.breakdown.experiencePoints - a.breakdown.experiencePoints ||
      AVAILABILITY_RANK[b.candidate.availability] - AVAILABILITY_RANK[a.candidate.availability] ||
      getId(a) - getId(b)
  );
  return matches.map((match, index) => ({ rank: index + 1, ...match }));
}

// Job to candidates. Returns null if the job does not exist.
// Not looking candidates are hidden unless includeUnavailable is true or the
// availability preference already counts them (include_low / include_fair).
function getMatchesForJob(jobId, preferences = DEFAULT_PREFERENCES, includeUnavailable = false) {
  const job = jobModel.getJobById(jobId);
  if (job === null) return null;
  const candidates = candidateModel.getAllCandidates().filter(
    (candidate) => includeUnavailable || isVisible(candidate.availability, preferences)
  );
  const matches = candidates.map((candidate) => buildMatch(job, candidate, preferences));
  return { job, matches: sortAndRank(matches, (match) => match.candidate.id) };
}

// Candidate to jobs. Returns null if the candidate does not exist.
// The candidate was explicitly picked here, so a Not looking candidate is never hidden.
function getMatchesForCandidate(candidateId, preferences = DEFAULT_PREFERENCES) {
  const candidate = candidateModel.getCandidateById(candidateId);
  if (candidate === null) return null;
  const jobs = jobModel.getAllJobs();
  const matches = jobs.map((job) => buildMatch(job, candidate, preferences));
  return { candidate, matches: sortAndRank(matches, (match) => match.job.id) };
}

module.exports = { getMatchesForJob, getMatchesForCandidate };
