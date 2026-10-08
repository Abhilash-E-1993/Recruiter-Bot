// tests/scoring.test.js
// Tests for the pure functions in scoring.js and reason.js. No database needed.
// Run with: npm test
const test = require('node:test');
const assert = require('node:assert/strict');
const { scoreMatch, isVisible, round2 } = require('../src/services/scoring');
const { buildReason } = require('../src/services/reason');

// Sherlock vs Backend Detective (job 1): needs 3 years and deduction, forensics, pattern-recognition.
const sherlock = {
  requiredSkills: ['deduction', 'forensics', 'pattern-recognition'],
  candidateSkills: ['deduction', 'forensics', 'pattern-recognition'],
  requiredYears: 3,
  candidateYears: 8,
  availability: 'Immediate',
  flags: [
    { name: 'Analytical', category: 'green', score: 2 },
    { name: 'Blunt', category: 'yellow', score: 1 },
    { name: 'Insufferable', category: 'red', score: -1 },
  ],
};

// Hermione vs Backend Detective: no matching skills, 4 years, 2 weeks.
const hermione = {
  requiredSkills: ['deduction', 'forensics', 'pattern-recognition'],
  candidateSkills: ['research', 'time-management', 'public-speaking'],
  requiredYears: 3,
  candidateYears: 4,
  availability: '2 weeks',
  flags: [
    { name: 'Detail-oriented', category: 'green', score: 2 },
    { name: 'Overachiever', category: 'green', score: 2 },
    { name: 'Documentation-first', category: 'yellow', score: 1 },
  ],
};

// Tony vs Rapid Prototyping Engineer (job 2): both required skills, 12 years vs 2, Not looking.
const tony = {
  requiredSkills: ['rapid-prototyping', 'systems-design'],
  candidateSkills: ['systems-design', 'rapid-prototyping', 'leadership'],
  requiredYears: 2,
  candidateYears: 12,
  availability: 'Not looking',
  flags: [
    { name: 'Confident', category: 'green', score: 2 },
    { name: 'Innovative', category: 'green', score: 2 },
    { name: 'Refuses to write tests', category: 'red', score: -1 },
  ],
};

// Hermione vs Developer Relations Lead (job 3): both required skills, 4 years vs 2.
const hermioneDevRel = {
  requiredSkills: ['public-speaking', 'research'],
  candidateSkills: ['research', 'time-management', 'public-speaking'],
  requiredYears: 2,
  candidateYears: 4,
  availability: '2 weeks',
  flags: [
    { name: 'Detail-oriented', category: 'green', score: 2 },
    { name: 'Overachiever', category: 'green', score: 2 },
    { name: 'Documentation-first', category: 'yellow', score: 1 },
  ],
};

// ---------- Golden scores ----------

test('Sherlock vs Backend Detective scores 76 with default preferences', () => {
  assert.equal(scoreMatch(sherlock).finalScore, 76);
});

test('Hermione with default preferences scores 5 (0% skill match means no experience points)', () => {
  assert.equal(scoreMatch(hermione).finalScore, 5);
});

test('Customized skills/allow/include_low: Sherlock 107, Hermione 5', () => {
  const preferences = { priority: 'skills', overqualification: 'allow', availability: 'include_low' };
  assert.equal(scoreMatch(sherlock, preferences).finalScore, 107);
  assert.equal(scoreMatch(hermione, preferences).finalScore, 5);
});

test('Customized experience/penalize/include_fair: Sherlock 84.4, Hermione 5', () => {
  const preferences = { priority: 'experience', overqualification: 'penalize', availability: 'include_fair' };
  assert.equal(scoreMatch(sherlock, preferences).finalScore, 84.4);
  assert.equal(scoreMatch(hermione, preferences).finalScore, 5);
});

test('2 weeks counts in full: Hermione vs Developer Relations Lead scores 90 by default', () => {
  assert.equal(scoreMatch(hermioneDevRel).finalScore, 90);
});

test('Not looking: flags only by default (3), x0.25 gives 19.25, x0.5 gives 35.5', () => {
  assert.equal(scoreMatch(tony).finalScore, 3);
  const low = { priority: 'none', overqualification: 'penalize', availability: 'include_low' };
  const fair = { priority: 'none', overqualification: 'penalize', availability: 'include_fair' };
  assert.equal(scoreMatch(tony, low).finalScore, 19.25);
  assert.equal(scoreMatch(tony, fair).finalScore, 35.5);
});



// ---------- Skill match ----------

test('Skills: 3 of 3 gives 100, 1 of 3 gives 33.33, 0 of 3 gives 0', () => {
  assert.equal(scoreMatch(sherlock).skillPercentage, 100);
  assert.equal(round2(scoreMatch({ ...sherlock, candidateSkills: ['deduction'] }).skillPercentage), 33.33);
  assert.equal(scoreMatch(hermione).skillPercentage, 0);
});

test('A job with no required skills gives a 100% skill match', () => {
  assert.equal(scoreMatch({ ...sherlock, requiredSkills: [] }).skillPercentage, 100);
});

// ---------- Experience curve (required: 3 years) ----------

test('Experience points follow the curve for 3 to 10 years against 3 required', () => {
  const expected = [20, 23, 25, 22, 18, 14, 10, 5]; // candidate years 3,4,5,6,7,8,9,10
  expected.forEach((points, index) => {
    const result = scoreMatch({ ...sherlock, candidateYears: 3 + index });
    assert.equal(result.experiencePoints, points);
  });
});

test('20 years against 3 required still gives 5 experience points', () => {
  assert.equal(scoreMatch({ ...sherlock, candidateYears: 20 }).experiencePoints, 5);
});

test('1 year against 3 required gives 6.67 points and is underqualified', () => {
  const result = scoreMatch({ ...sherlock, candidateYears: 1 });
  assert.equal(result.experiencePoints, 6.67);
  assert.equal(result.experienceFit, 'underqualified');
});

test('Fit labels: 5 years is good_fit, 7 years is overqualified', () => {
  assert.equal(scoreMatch({ ...sherlock, candidateYears: 5 }).experienceFit, 'good_fit');
  assert.equal(scoreMatch({ ...sherlock, candidateYears: 7 }).experienceFit, 'overqualified');
});

test('Policy allow: 5 years above gives 25 and good_fit, 0 years above still gives 20', () => {
  const preferences = { priority: 'none', overqualification: 'allow', availability: 'default' };
  const above5 = scoreMatch({ ...sherlock, candidateYears: 8 }, preferences);
  assert.equal(above5.experiencePoints, 25);
  assert.equal(above5.experienceFit, 'good_fit');
  assert.equal(scoreMatch({ ...sherlock, candidateYears: 3 }, preferences).experiencePoints, 20);
});

// ---------- Availability and flags ----------

test('Not looking gives the flag score only (2 for Sherlock)', () => {
  assert.equal(scoreMatch({ ...sherlock, availability: 'Not looking' }).finalScore, 2);
});

test('Flag score is the sum of all flags (mixed flags give +2)', () => {
  assert.equal(scoreMatch(sherlock).flagScore, 2);
});

test('Experience scales with the skill match fraction: 1 of 3 skills keeps a third of the points', () => {
  // 9 years vs 3 required is 6 above the minimum (10 points); 1/3 skills keeps 3.33.
  const result = scoreMatch({ ...sherlock, candidateSkills: ['deduction'], candidateYears: 9 });
  assert.equal(result.experiencePoints, 3.33);
});

test('0% skill match earns zero experience points', () => {
  assert.equal(scoreMatch(hermione).experiencePoints, 0);
});

test('Visibility: Not looking is hidden by default and shown by the include rows', () => {
  assert.equal(isVisible('Immediate'), true);
  assert.equal(isVisible('2 weeks'), true);
  assert.equal(isVisible('Not looking'), false);
  const low = { priority: 'none', overqualification: 'penalize', availability: 'include_low' };
  const fair = { priority: 'none', overqualification: 'penalize', availability: 'include_fair' };
  assert.equal(isVisible('Not looking', low), true);
  assert.equal(isVisible('Not looking', fair), true);
});

// ---------- Reason sentence ----------

test('Sherlock gets the exact golden reason sentence', () => {
  const reason = buildReason({
    skillPercentage: 100,
    requiredSkillCount: 3,
    experienceFit: 'overqualified',
    availability: 'Immediate',
    flags: sherlock.flags,
  });
  assert.equal(
    reason,
    'Matches 100% of the required skills. Available immediately. ' +
      'Exceeds the experience range and may be overqualified. ' +
      'Analytical positively affects the score, while Insufferable slightly reduces it.'
  );
});

test('A candidate with only yellow flags has no flag sentence', () => {
  const reason = buildReason({
    skillPercentage: 50,
    requiredSkillCount: 2,
    experienceFit: 'good_fit',
    availability: '2 weeks',
    flags: [{ name: 'Blunt', category: 'yellow', score: 1 }],
  });
  assert.equal(reason, 'Matches 50% of the required skills. Available in two weeks. Experience is a good fit.');
});

test('Underqualified sentence', () => {
  const reason = buildReason({
    skillPercentage: 0,
    requiredSkillCount: 3,
    experienceFit: 'underqualified',
    availability: 'Not looking',
    flags: [],
  });
  assert.equal(
    reason,
    'Matches 0% of the required skills. Currently not looking. Below the required experience and may be underqualified.'
  );
});

test('Two green flags give "A and B positively affect the score"', () => {
  const reason = buildReason({
    skillPercentage: 100,
    requiredSkillCount: 1,
    experienceFit: 'good_fit',
    availability: 'Immediate',
    flags: [
      { name: 'Overachiever', category: 'green', score: 2 },
      { name: 'Detail-oriented', category: 'green', score: 2 },
    ],
  });
  assert.ok(reason.endsWith('Detail-oriented and Overachiever positively affect the score.'));
});

test('Zero required skills gives "Job lists no required skills."', () => {
  const reason = buildReason({
    skillPercentage: 100,
    requiredSkillCount: 0,
    experienceFit: 'good_fit',
    availability: 'Immediate',
    flags: [],
  });
  assert.ok(reason.startsWith('Job lists no required skills.'));
});

