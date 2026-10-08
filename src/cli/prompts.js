// src/cli/prompts.js
// Every question asked in the terminal. Each one is an inquirer list prompt
// (arrow keys and Enter); the user never types numbers or ids.
const inquirer = require('inquirer');
const chalk = require('chalk');
const { DEFAULT_PREFERENCES } = require('../services/scoring');

// One menu choice: a bold label with a dim one-line hint; the echoed answer stays the plain label.
function choice(label, hint, value) {
  return { name: chalk.bold(label) + (hint ? chalk.dim('  ' + hint) : ''), value, short: label };
}

// Asks one list question and returns the chosen value.
async function ask(message, choices) {
  const answers = await inquirer.prompt([{ type: 'list', name: 'value', message, choices, pageSize: 15 }]);
  return answers.value;
}

// The four onboarding questions. Generalized skips Steps 2 to 4 and uses the defaults.
async function askPreferences() {
  const style = await ask('How would you like Recruiter Bot to rank candidates?', [
    choice('Generalized matching', 'Use the default matching criteria.', 'generalized'),
    choice('Customized matching', 'Adjust the matching criteria based on your preferences.', 'customized'),
  ]);
  if (style === 'generalized') return { ...DEFAULT_PREFERENCES };

  const priority = await ask('Step 2 of 4: When comparing two candidates, what should matter more?', [
    choice('Skills', 'The candidate who has more of the required skills wins.', 'skills'),
    choice('Experience', 'The candidate whose experience fits the role better wins.', 'experience'),
  ]);

  console.log(chalk.dim('Example: a role asks for 3 years of experience, but the candidate has 7+.'));
  const overqualification = await ask('Step 3 of 4: Is having far more experience than required a good thing?', [
    choice('Not always - prefer a close fit', 'Far-above candidates are marked overqualified and score lower.', 'penalize'),
    choice('Yes - more experience is always valuable', 'No penalty for exceeding the requirement.', 'allow'),
  ]);

  const availability = await ask('Step 4 of 4: Should candidates who are not currently looking appear in your results?', [
    choice('No, hide them', 'Only candidates who can join now or in 2 weeks are shown.', 'default'),
    choice('Yes, but rank them lower', 'They are shown, with their score multiplied by 0.25.', 'include_low'),
    choice('Yes, count them more fairly', 'They are shown, with their score multiplied by 0.5.', 'include_fair'),
  ]);

  return { priority, overqualification, availability };
}

// The main menu. Returns 'job', 'candidate', 'preferences', 'how' or 'exit'.
async function askMainMenu() {
  return ask('What would you like to do?', [
    choice('Find the best candidates for a job', 'pick a job, see ranked candidates', 'job'),
    choice('Find the best jobs for a candidate', 'pick a candidate, see ranked jobs', 'candidate'),
    choice('Change matching preferences', 'answer the questions again', 'preferences'),
    choice('How scoring works', 'the formula in plain English', 'how'),
    choice('Exit', null, 'exit'),
  ]);
}

// Arrow-key list of jobs. Returns the job id, or null for Back to menu.
async function askJob(jobs) {
  const choices = jobs.map((job) =>
    choice(job.title, 'needs ' + job.minExperienceYears + '+ yrs: ' + job.skills.join(', '), job.id)
  );
  choices.push(choice('Back to menu', null, null));
  return ask('Which job?', choices);
}

// Arrow-key list of candidates. Returns the candidate id, or null for Back to menu.
async function askCandidate(candidates) {
  const choices = candidates.map((candidate) =>
    choice(candidate.name, candidate.experienceYears + ' yrs, ' + candidate.availability, candidate.id)
  );
  choices.push(choice('Back to menu', null, null));
  return ask('Which candidate?', choices);
}

// After a ranking: more explanations or back to the menu. Returns 'all' or 'menu'.
async function askNext() {
  return ask('What next?', [
    choice('See the explanation for every other match', null, 'all'),
    choice('Back to the main menu', null, 'menu'),
  ]);
}

module.exports = { askPreferences, askMainMenu, askJob, askCandidate, askNext };
