-- database/schema.sql (SQLite). Run by database/setup.js.
-- Drops and recreates every table, so setup can be run again at any time.
-- Link tables are dropped first because they point at the others.
DROP TABLE IF EXISTS candidate_flags;
DROP TABLE IF EXISTS candidate_skills;
DROP TABLE IF EXISTS job_skills;
DROP TABLE IF EXISTS flags;
DROP TABLE IF EXISTS skills;
DROP TABLE IF EXISTS jobs;
DROP TABLE IF EXISTS candidates;

CREATE TABLE candidates (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  experience_years INTEGER NOT NULL CHECK (experience_years >= 0),
  availability TEXT NOT NULL CHECK (availability IN ('Immediate', '2 weeks', 'Not looking')),
  quirk TEXT
);

CREATE TABLE skills (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE COLLATE NOCASE
);

CREATE TABLE candidate_skills (
  candidate_id INTEGER NOT NULL,
  skill_id INTEGER NOT NULL,
  PRIMARY KEY (candidate_id, skill_id),
  FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE,
  FOREIGN KEY (skill_id) REFERENCES skills(id)
);

CREATE TABLE flags (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE COLLATE NOCASE,
  category TEXT NOT NULL CHECK (category IN ('green', 'yellow', 'red')),
  score INTEGER NOT NULL
);

CREATE TABLE candidate_flags (
  candidate_id INTEGER NOT NULL,
  flag_id INTEGER NOT NULL,
  PRIMARY KEY (candidate_id, flag_id),
  FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE,
  FOREIGN KEY (flag_id) REFERENCES flags(id)
);

CREATE TABLE jobs (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL UNIQUE,
  min_experience_years INTEGER NOT NULL CHECK (min_experience_years >= 0),
  culture_keywords TEXT,
  tagline TEXT
);

CREATE TABLE job_skills (
  job_id INTEGER NOT NULL,
  skill_id INTEGER NOT NULL,
  PRIMARY KEY (job_id, skill_id),
  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
  FOREIGN KEY (skill_id) REFERENCES skills(id)
);
