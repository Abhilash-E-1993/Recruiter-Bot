// src/models/jobModel.js
// ALL job SQL lives in this file. Read the queries first; the functions below only run them.
const db = require('../config/db');

// ---------- The SQL ----------

// Every job, lowest id first.
const SQL_ALL_JOBS = `
  SELECT id, title, min_experience_years AS minExperienceYears,
         culture_keywords AS cultureKeywords, tagline
  FROM jobs
  ORDER BY id`;

// One job. The ? is replaced by the id we pass in.
const SQL_JOB_BY_ID = `
  SELECT id, title, min_experience_years AS minExperienceYears,
         culture_keywords AS cultureKeywords, tagline
  FROM jobs
  WHERE id = ?`;

// Required skill names of every job. JOIN looks up each skill_id in the skills table.
const SQL_ALL_JOB_SKILLS = `
  SELECT job_skills.job_id AS jobId, skills.name AS name
  FROM job_skills
  JOIN skills ON skills.id = job_skills.skill_id
  ORDER BY skills.name`;

// The same, for one job.
const SQL_SKILLS_OF_JOB = `
  SELECT job_skills.job_id AS jobId, skills.name AS name
  FROM job_skills
  JOIN skills ON skills.id = job_skills.skill_id
  WHERE job_skills.job_id = ?
  ORDER BY skills.name`;

// ---------- The functions ----------

// Puts each job's required skill names onto the job object.
function attachSkills(jobs, skillRows) {
  return jobs.map((job) => ({
    ...job,
    skills: skillRows.filter((row) => row.jobId === job.id).map((row) => row.name),
  }));
}

// Returns every job, each with skills: [required skill names].
function getAllJobs() {
  const jobs = db.prepare(SQL_ALL_JOBS).all();
  const skillRows = db.prepare(SQL_ALL_JOB_SKILLS).all();
  return attachSkills(jobs, skillRows);
}

// Returns one job in the same shape, or null if the id does not exist.
function getJobById(id) {
  const jobs = db.prepare(SQL_JOB_BY_ID).all(id);
  if (jobs.length === 0) return null;
  const skillRows = db.prepare(SQL_SKILLS_OF_JOB).all(id);
  return attachSkills(jobs, skillRows)[0];
}

module.exports = { getAllJobs, getJobById };
