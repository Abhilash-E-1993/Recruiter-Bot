// database/setup.js
// npm run setup: creates database/recruiter.db and loads the seed data.
// Safe to run again: schema.sql drops and recreates every table first.
const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
const { flags, candidates, jobs } = require('./seedData');

// Category decides the score: green +2, yellow +1, red -1.
const CATEGORY_SCORE = { green: 2, yellow: 1, red: -1 };

// Opens (or creates) the SQLite file and switches foreign keys on.
const db = new Database(path.join(__dirname, 'recruiter.db'));
db.pragma('foreign_keys = ON');

try {
  // Drop and recreate every table.
  const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  db.exec(sql);

  // One prepared INSERT per table; every value goes in as a ? parameter.
  const insertFlag = db.prepare('INSERT INTO flags (name, category, score) VALUES (?, ?, ?)');
  const insertSkill = db.prepare('INSERT INTO skills (name) VALUES (?)');
  const insertCandidate = db.prepare(
    'INSERT INTO candidates (id, name, experience_years, availability, quirk) VALUES (?, ?, ?, ?, ?)'
  );
  const insertCandidateSkill = db.prepare(
    'INSERT INTO candidate_skills (candidate_id, skill_id) VALUES (?, ?)'
  );
  const insertCandidateFlag = db.prepare(
    'INSERT INTO candidate_flags (candidate_id, flag_id) VALUES (?, ?)'
  );
  const insertJob = db.prepare(
    'INSERT INTO jobs (id, title, min_experience_years, culture_keywords, tagline) VALUES (?, ?, ?, ?, ?)'
  );
  const insertJobSkill = db.prepare('INSERT INTO job_skills (job_id, skill_id) VALUES (?, ?)');

  // All inserts in one transaction: if anything throws, everything rolls back.
  const loadAll = db.transaction(() => {
    // Flags first, remembering each flag id by name.
    const flagIds = {};
    for (const category of Object.keys(flags)) {
      for (const name of flags[category]) {
        const result = insertFlag.run(name, category, CATEGORY_SCORE[category]);
        flagIds[name] = result.lastInsertRowid;
      }
    }

    // Skills: distinct names in order of first appearance (candidates first, then jobs).
    const skillIds = {};
    const rememberSkill = (name) => {
      if (skillIds[name] === undefined) {
        skillIds[name] = insertSkill.run(name).lastInsertRowid;
      }
    };
    candidates.forEach((candidate) => candidate.skills.forEach(rememberSkill));
    jobs.forEach((job) => job.skills.forEach(rememberSkill));

    // Candidates (explicit ids), then their skill and flag links.
    for (const candidate of candidates) {
      insertCandidate.run(
        candidate.id, candidate.name, candidate.experienceYears, candidate.availability, candidate.quirk
      );
      for (const skill of candidate.skills) insertCandidateSkill.run(candidate.id, skillIds[skill]);
      for (const flag of candidate.flags) insertCandidateFlag.run(candidate.id, flagIds[flag]);
    }

    // Jobs (explicit ids), then their required skill links.
    for (const job of jobs) {
      insertJob.run(job.id, job.title, job.minExperienceYears, job.cultureKeywords, job.tagline);
      for (const skill of job.skills) insertJobSkill.run(job.id, skillIds[skill]);
    }
  });
  loadAll();
} catch (error) {
  console.error(error);
  process.exit(1);
}

// Sanity check: print the row counts.
const count = (table) => db.prepare('SELECT COUNT(*) AS n FROM ' + table).get().n;
console.log('Candidates: ' + count('candidates'));
console.log('Jobs: ' + count('jobs'));
console.log('Skills: ' + count('skills'));
console.log('Flags: ' + count('flags'));
console.log('Setup complete. Run: npm run cli');
