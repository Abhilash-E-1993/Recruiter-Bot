// src/services/reason.js
// Builds the one-paragraph explanation for a match. Pure functions, no database.

// 100 -> '100', 66.666 -> '66.7', 33.33 -> '33.3'.
function formatPercent(percentage) {
  return Number(percentage.toFixed(1)).toString();
}

// Builds the flag sentence: up to 2 green flags (A to Z) and the first red flag (A to Z).
// Yellow flags count in the score but are never named.
function buildFlagSentence(flags) {
  const byName = (a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase());
  const greens = flags.filter((flag) => flag.category === 'green').sort(byName).slice(0, 2).map((flag) => flag.name);
  const reds = flags.filter((flag) => flag.category === 'red').sort(byName);
  const red = reds.length > 0 ? reds[0].name : null;
  let positive = '';
  if (greens.length === 1) positive = greens[0] + ' positively affects the score';
  if (greens.length === 2) positive = greens[0] + ' and ' + greens[1] + ' positively affect the score';
  if (positive && red) return positive + ', while ' + red + ' slightly reduces it.';
  if (positive) return positive + '.';
  if (red) return red + ' slightly reduces the score.';
  return '';
}

// Builds the full explanation for one match.
// match: { skillPercentage, requiredSkillCount, experienceFit, availability, flags }
function buildReason(match) {
  const parts = [];
  if (match.requiredSkillCount === 0) {
    parts.push('Job lists no required skills.');
  } else {
    parts.push('Matches ' + formatPercent(match.skillPercentage) + '% of the required skills.');
  }
  const availabilityText = {
    'Immediate': 'Available immediately.',
    '2 weeks': 'Available in two weeks.',
    'Not looking': 'Currently not looking.',
  };
  parts.push(availabilityText[match.availability]);
  const fitText = {
    good_fit: 'Experience is a good fit.',
    overqualified: 'Exceeds the experience range and may be overqualified.',
    underqualified: 'Below the required experience and may be underqualified.',
  };
  parts.push(fitText[match.experienceFit]);
  const flagSentence = buildFlagSentence(match.flags);
  if (flagSentence) parts.push(flagSentence);
  return parts.join(' ');
}

module.exports = { buildReason };
