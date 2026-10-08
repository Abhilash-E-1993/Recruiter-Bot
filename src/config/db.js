// src/config/db.js
// Opens the SQLite file once. Every model shares this one connection.
const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const dbFile = path.join(__dirname, '..', '..', 'database', 'recruiter.db');

// Friendly message if setup has not been run yet.
if (!fs.existsSync(dbFile)) {
  console.error('Database not found. Run this first: npm run setup');
  process.exit(1);
}

const db = new Database(dbFile);
db.pragma('foreign_keys = ON'); // SQLite ignores foreign keys unless this is switched on

module.exports = db;
