// src/services/scoring.js
// Pure maths. No database, no HTTP, no printing.

// Experience points by how many years the candidate is ABOVE the job minimum (0 to 6).
const EXPERIENCE_POINTS = [20, 23, 25, 22, 18, 14, 10];
const FAR_ABOVE_POINTS = 5; // 7 or more years above the minimum

// Availability multipliers. Immediate and 2 weeks both count in full (two weeks is not a
// real delay), so the only question is how to treat candidates who are Not looking:
// hidden (default), or included with a reduced multiplier (0.25 or 0.5).
const AVAILABILITY_MULTIPLIERS = {
  default:      { 'Immediate': 1, '2 weeks': 1, 'Not looking': 0 },
  include_low:  { 'Immediate': 1, '2 weeks': 1, 'Not looking': 0.25 },
  include_fair: { 'Immediate': 1, '2 weeks': 1, 'Not looking': 0.5 },
};

// Generalized matching uses these defaults.
const DEFAULT_PREFERENCES = { priority: 'none', overqualification: 'penalize', availability: 'default' };

// Rounds to 2 decimals (76.004 becomes 76).
function round2(number) {
  return Math.round((number + Number.EPSILON) * 100) / 100;
}

// Which required skills the candidate has, which are missing, and the match percentage.
function calcSkillMatch(requiredSkills, candidateSkills) {
  const matched = requiredSkills.filter((skill) => candidateSkills.includes(skill));
  const missing = requiredSkills.filter((skill) => !candidateSkills.includes(skill));
  const percentage = requiredSkills.length === 0 ? 100 : (matched.length / requiredSkills.length) * 100;
  return { matched, missing, percentage };
}

// Experience points and the fit label (good_fit, overqualified, underqualified).
function calcExperience(candidateYears, requiredYears, overqualification) {
  const yearsAbove = candidateYears - requiredYears;
  if (yearsAbove < 0) {
    return { points: (20 * candidateYears) / requiredYears, fit: 'underqualified' };
  }
  if (overqualification === 'allow' && yearsAbove >= 2) {
    return { points: 25, fit: 'good_fit' };
  }
  const points = yearsAbove <= 6 ? EXPERIENCE_POINTS[yearsAbove] : FAR_ABOVE_POINTS;
  const fit = overqualification === 'penalize' && yearsAbove >= 4 ? 'overqualified' : 'good_fit';
  return { points, fit };
}

// The Step 2 answer decides how much each part counts.
function getWeights(priority) {
  if (priority === 'skills') return { skillMax: 80, experienceScale: 1 };
  if (priority === 'experience') return { skillMax: 60, experienceScale: 1.6 };
  return { skillMax: 60, experienceScale: 1 };
}

// Scores one candidate against one job.
// input: { requiredSkills, candidateSkills, requiredYears, candidateYears, availability, flags: [{ name, category, score }] }
function scoreMatch(input, preferences = DEFAULT_PREFERENCES) {
  const weights = getWeights(preferences.priority);
  const skill = calcSkillMatch(input.requiredSkills, input.candidateSkills);
  const experience = calcExperience(input.candidateYears, input.requiredYears, preferences.overqualification);
  const skillPoints = (weights.skillMax * skill.percentage) / 100;
  // Experience counts only in proportion to skill match: 0% skills means no experience points.
  const experiencePoints = experience.points * weights.experienceScale * (skill.percentage / 100);
  const multiplier = AVAILABILITY_MULTIPLIERS[preferences.availability][input.availability];
  const flagScore = input.flags.reduce((sum, flag) => sum + flag.score, 0);
  const finalScore = (skillPoints + experiencePoints) * multiplier + flagScore;
  return {
    skillPercentage: skill.percentage,
    matchedSkills: skill.matched,
    missingSkills: skill.missing,
    experienceFit: experience.fit,
    skillPoints: round2(skillPoints),
    experiencePoints: round2(experiencePoints),
    availabilityMultiplier: multiplier,
    flagScore,
    finalScore: round2(finalScore),
  };
}

// A candidate is hidden from results only when they are Not looking and the chosen
// availability row gives them a zero multiplier.
function isVisible(availability, preferences = DEFAULT_PREFERENCES) {
  return availability !== 'Not looking' || AVAILABILITY_MULTIPLIERS[preferences.availability]['Not looking'] > 0;
}

module.exports = { scoreMatch, isVisible, DEFAULT_PREFERENCES, round2 };
