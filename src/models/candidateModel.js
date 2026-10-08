// src/models/candidateModel.js
// ALL candidate SQL lives in this file. Read the queries first; the functions below only run them.
const db = require('../config/db');

// ---------- The SQL ----------

// Every candidate, lowest id first. AS renames a column to its JavaScript name.
const SQL_ALL_CANDIDATES = `
  SELECT id, name, experience_years AS experienceYears, availability, quirk
  FROM candidates
  ORDER BY id`;

// One candidate. The ? is replaced by the id we pass in, so values are never pasted into the SQL text.
const SQL_CANDIDATE_BY_ID = `
  SELECT id, name, experience_years AS experienceYears, availability, quirk
  FROM candidates
  WHERE id = ?`;

// Skill names of every candidate. JOIN looks up each skill_id in the skills table.
const SQL_ALL_CANDIDATE_SKILLS = `
  SELECT candidate_skills.candidate_id AS candidateId, skills.name AS name
  FROM candidate_skills
  JOIN skills ON skills.id = candidate_skills.skill_id
  ORDER BY skills.name`;

// The same, for one candidate.
const SQL_SKILLS_OF_CANDIDATE = `
  SELECT candidate_skills.candidate_id AS candidateId, skills.name AS name
  FROM candidate_skills
  JOIN skills ON skills.id = candidate_skills.skill_id
  WHERE candidate_skills.candidate_id = ?
  ORDER BY skills.name`;

// Flags (name, colour, score) of every candidate.
const SQL_ALL_CANDIDATE_FLAGS = `
  SELECT candidate_flags.candidate_id AS candidateId, flags.name AS name,
         flags.category AS category, flags.score AS score
  FROM candidate_flags
  JOIN flags ON flags.id = candidate_flags.flag_id
  ORDER BY flags.name`;

// The same, for one candidate.
const SQL_FLAGS_OF_CANDIDATE = `
  SELECT candidate_flags.candidate_id AS candidateId, flags.name AS name,
         flags.category AS category, flags.score AS score
  FROM candidate_flags
  JOIN flags ON flags.id = candidate_flags.flag_id
  WHERE candidate_flags.candidate_id = ?
  ORDER BY flags.name`;

// ---------- The functions ----------

// Puts each candidate's skill names and flags onto the candidate object.
function attachDetails(candidates, skillRows, flagRows) {
  return candidates.map((candidate) => ({
    ...candidate,
    skills: skillRows.filter((row) => row.candidateId === candidate.id).map((row) => row.name),
    flags: flagRows
      .filter((row) => row.candidateId === candidate.id)
      .map((row) => ({ name: row.name, category: row.category, score: row.score })),
  }));
}

// Returns every candidate, each with skills: [names] and flags: [{ name, category, score }].
function getAllCandidates() {
  const candidates = db.prepare(SQL_ALL_CANDIDATES).all();
  const skillRows = db.prepare(SQL_ALL_CANDIDATE_SKILLS).all();
  const flagRows = db.prepare(SQL_ALL_CANDIDATE_FLAGS).all();
  return attachDetails(candidates, skillRows, flagRows);
}

// Returns one candidate in the same shape, or null if the id does not exist.
function getCandidateById(id) {
  const candidates = db.prepare(SQL_CANDIDATE_BY_ID).all(id);
  if (candidates.length === 0) return null;
  const skillRows = db.prepare(SQL_SKILLS_OF_CANDIDATE).all(id);
  const flagRows = db.prepare(SQL_FLAGS_OF_CANDIDATE).all(id);
  return attachDetails(candidates, skillRows, flagRows)[0];
}

module.exports = { getAllCandidates, getCandidateById };
