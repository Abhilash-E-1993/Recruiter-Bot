// src/server.js
// npm start: runs the API (default port 3000, override with the PORT environment variable).
const app = require('./app');

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log('Recruiter Bot API running on http://localhost:' + port);
  console.log('Try: curl http://localhost:' + port + '/jobs/1/matches');
});
