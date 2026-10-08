// src/app.js
// Builds the express app: the match routes plus a 404 for everything else.
const express = require('express');
const matchRoutes = require('./routes/matchRoutes');

const app = express();

app.use(matchRoutes);
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));

module.exports = app;
