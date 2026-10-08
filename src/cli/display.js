// src/cli/display.js
// Every table, card and colour. Only this file knows about chalk and cli-table3.
// Colour means one thing everywhere: green = good, yellow = caution,
// red = bad or unavailable, dim = secondary text, cyan = headings.
const chalk = require('chalk');
const Table = require('cli-table3');

// Pads text with spaces so it sits in the middle of a fixed width.
function center(text, width) {
  const room = width - text.length;
  const left = Math.floor(room / 2);
  return ' '.repeat(left) + text + ' '.repeat(room - left);
}

// Prints the welcome banner, a tip about the terminal width, and what happens first.
function showBanner() {
  const WIDTH = 48;
  const edge = '─'.repeat(WIDTH);
  const box = (content) => '  ' + chalk.bold.cyan('│') + content + chalk.bold.cyan('│');
  console.log();
  console.log('  ' + chalk.bold.cyan('┌' + edge + '┐'));
  console.log(box(chalk.bold.cyan(center('R E C R U I T E R   B O T', WIDTH))));
  console.log(box(chalk.cyan(center('Explainable candidate-job matching', WIDTH))));
  console.log('  ' + chalk.bold.cyan('└' + edge + '┘'));
  console.log();
  // The tables are wide, so a narrow window makes them harder to read.
  const columns = process.stdout.columns || 80;
  if (columns < 100) {
    console.log('  ' + chalk.yellow('Tip: expand your terminal window for a better view of the tables.'));
  } else {
    console.log('  ' + chalk.dim('Tip: nothing is cleared, so you can scroll back at any time.'));
  }
  console.log('  ' + chalk.dim('First, answer a few quick questions to set your matching style.'));
  console.log();
}

// Prints the chosen ranking style. The detail rows appear only for customized matching.
function showPreferences(preferences) {
  const rankingStyle =
    preferences.priority === 'none' ? 'Generalized matching (default criteria)' : 'Customized matching';
  const priorityLabels = {
    skills: 'Skills matter most',
    experience: 'Experience matters most',
    availability: 'Availability matters most',
  };
  const overqualificationLabels = {
    penalize: 'Prefer experience close to the requirement',
    allow: 'More experience is always valuable',
  };
  const availabilityLabels = {
    default: 'Not looking candidates are hidden',
    include_low: 'Not looking candidates included (score x0.25)',
    include_fair: 'Not looking candidates included (score x0.5)',
  };
  // One dim label row, label column padded to 14 characters.
  const row = (label, value) => console.log('  ' + chalk.dim(label.padEnd(14)) + '  ' + value);
  console.log('  ' + chalk.cyan('Your matching style'));
  row('Ranking style', rankingStyle);
  if (preferences.priority !== 'none') {
    row('Priority', priorityLabels[preferences.priority]);
    row('Experience', overqualificationLabels[preferences.overqualification]);
    row('Availability', availabilityLabels[preferences.availability]);
  }
  console.log();
}

// Colours one fit word: good fit green, overqualified yellow, underqualified red.
function colorFit(fit) {
  if (fit === 'good_fit') return chalk.green('good fit');
  if (fit === 'overqualified') return chalk.yellow('overqualified');
  return chalk.red('underqualified');
}

// Colours one availability value: Immediate green, 2 weeks yellow, Not looking red.
function colorAvailability(availability) {
  if (availability === 'Immediate') return chalk.green(availability);
  if (availability === '2 weeks') return chalk.yellow(availability);
  return chalk.red(availability);
}

// Colours the score: rank 1 bold green, ranks 2 and 3 green, the rest default.
function colorScore(rank, score) {
  const text = score.toFixed(2);
  if (rank === 1) return chalk.bold.green(text);
  if (rank <= 3) return chalk.green(text);
  return text;
}

// The Skills cell: "100% (3/3)" = percentage (matched/total).
function skillsCell(match) {
  const total = match.matchedSkills.length + match.missingSkills.length;
  return match.skillMatchPercentage + '% (' + match.matchedSkills.length + '/' + total + ')';
}

// Ranked candidates table for one job, then explanation cards for the top 3.
function showJobMatches(result, preferences) {
  showPreferences(preferences);
  const job = result.job;
  console.log('  ' + chalk.bold('Best candidates for: ' + job.title) +
    chalk.dim('  (needs ' + job.minExperienceYears + '+ yrs: ' + job.skills.join(', ') + ')'));
  console.log();
  const table = new Table({
    head: ['#', 'Candidate', 'Score', 'Skills', 'Experience', 'Availability'],
    style: { head: ['cyan'], border: ['gray'] },
  });
  for (const match of result.matches) {
    table.push([
      match.rank,
      match.candidate.name,
      colorScore(match.rank, match.score),
      skillsCell(match),
      match.candidate.experienceYears + ' yrs, ' + colorFit(match.experienceFit),
      colorAvailability(match.candidate.availability),
    ]);
  }
  console.log(table.toString());
  console.log();
  showMatchCards(result.matches.slice(0, 3), 'candidate', 'Top picks');
}

// Ranked jobs table for one candidate, then explanation cards for the top 3.
function showCandidateMatches(result, preferences) {
  showPreferences(preferences);
  const candidate = result.candidate;
  console.log('  ' + chalk.bold('Best jobs for: ' + candidate.name) +
    chalk.dim('  (' + candidate.experienceYears + ' yrs, ' + candidate.availability + ')'));
  console.log();
  const table = new Table({
    head: ['#', 'Job', 'Score', 'Skills', 'Experience'],
    style: { head: ['cyan'], border: ['gray'] },
  });
  for (const match of result.matches) {
    table.push([
      match.rank,
      match.job.title,
      colorScore(match.rank, match.score),
      skillsCell(match),
      'needs ' + match.job.minExperienceYears + '+ yrs, ' + colorFit(match.experienceFit),
    ]);
  }
  console.log(table.toString());
  console.log();
  showMatchCards(result.matches.slice(0, 3), 'job', 'Top picks');
}

// One explanation card per match. kind decides whether the name is the candidate's or the job's.
function showMatchCards(matches, kind, heading) {
  console.log('  ' + chalk.cyan(heading));
  console.log();
  for (const match of matches) {
    const name = kind === 'candidate' ? match.candidate.name : match.job.title;
    // The Skills line: matched skills green with a check, missing skills red with a cross.
    const skillParts = match.matchedSkills
      .map((skill) => chalk.green('✔ ' + skill))
      .concat(match.missingSkills.map((skill) => chalk.red('✘ ' + skill)));
    // The flags part of the maths line: "+ 2" or "- 1".
    const flagScore = match.breakdown.flagScore;
    const flagPart = (flagScore < 0 ? '- ' + Math.abs(flagScore) : '+ ' + flagScore) + ' flags';
    const math =
      '(' + match.breakdown.skillPoints.toFixed(2) + ' skills + ' +
      match.breakdown.experiencePoints.toFixed(2) + ' experience) x ' +
      match.breakdown.availabilityMultiplier.toFixed(2) + ' availability ' +
      flagPart + ' = ' + match.score.toFixed(2);
    // 4 lines: header, then Skills / Why / Math with a dim label column.
    const line = (label, value) => console.log('    ' + chalk.dim(label.padEnd(9)) + value);
    console.log('  ' + chalk.bold('#' + match.rank + '  ' + name) + '  ' + match.score.toFixed(2));
    line('Skills', skillParts.join('  '));
    line('Why', match.reason);
    line('Math', math);
    console.log();
  }
}

// The scoring formula in plain English, with the default numbers.
function showHowScoringWorks() {
  console.log('  ' + chalk.cyan('How scoring works'));
  console.log();
  console.log('  Final score = (Skill points + Experience points) x Availability multiplier + Flag score');
  console.log();
  console.log('  ' + chalk.dim('Skill points:') + '       60 x (matched required skills / total required skills)');
  console.log('  ' + chalk.dim('Experience points:') + ' a curve on years above the job minimum: 20 at the minimum,');
  console.log('                     peaks at 25 for 2 years above, then falls to 5 for 7+ years above,');
  console.log('                     multiplied by the skill match fraction (0% skills = no points)');
  console.log('  ' + chalk.dim('Availability:') + '       Immediate and 2 weeks both x1.00; Not looking candidates');
  console.log('                     are hidden, or count x0.25 / x0.50 if you include them');
  console.log('  ' + chalk.dim('Flags:') + '              green +2, yellow +1, red -1 (added at the end)');
  console.log();
  console.log(chalk.dim('  Your matching preferences (Steps 2 to 4) change these weights.'));
  console.log();
}

// Ctrl+C or Exit ends here.
function showGoodbye() {
  console.log(chalk.dim('Goodbye!'));
}

module.exports = {
  showBanner,
  showPreferences,
  showJobMatches,
  showCandidateMatches,
  showMatchCards,
  showHowScoringWorks,
  showGoodbye,
};

