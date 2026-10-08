// database/seedData.js
// The 15 candidates, 6 jobs and the flag catalog as plain JS data.
// Loaded into SQLite by database/setup.js (npm run setup).

// Flag catalog (40 rows). Score is implied by category: green +2, yellow +1, red -1.
const flags = {
  green: [
    'Analytical', 'Detail-oriented', 'Overachiever', 'Confident', 'Innovative',
    'Tenacious', 'Organized', 'Principled', 'Genius', 'Optimistic',
    'Sharp', 'Calm', 'Improviser', 'Brilliant', 'Resilient',
    'Decisive', 'Enthusiastic', 'Empathetic', 'Persistent', 'Loyal',
  ],
  yellow: [
    'Blunt', 'Intense', 'Demanding', 'Documentation-first', 'One-monitor preference',
    'Folksy metaphors', 'Reviews every PR personally', "World's best boss mug",
    'Underestimated in standup', 'Duct-tape improvisation', 'Assistant to regional backend engineer',
  ],
  red: [
    'Stubborn', 'Reckless', 'Rigid', 'Chaotic', 'Insufferable',
    'Refuses to write tests', 'Concerning mechanism', 'Poor communication', 'Poor public speaking',
  ],
};

// A candidate is { id, name, experienceYears, availability, skills, flags, quirk }.
// Ids are explicit and fixed.
const candidates = [
  {
    id: 1, name: 'Sherlock H.', experienceYears: 8, availability: 'Immediate',
    skills: ['deduction', 'pattern-recognition', 'forensics'],
    flags: ['Analytical', 'Blunt', 'Insufferable'],
    quirk: 'Solves problems by eliminating the impossible; occasionally insufferable in standups.',
  },
  {
    id: 2, name: 'Hermione G.', experienceYears: 4, availability: '2 weeks',
    skills: ['research', 'time-management', 'public-speaking'],
    flags: ['Detail-oriented', 'Overachiever', 'Documentation-first'],
    quirk: 'Reads the entire documentation before writing a single line of code.',
  },
  {
    id: 3, name: 'Tony S.', experienceYears: 12, availability: 'Not looking',
    skills: ['systems-design', 'rapid-prototyping', 'leadership'],
    flags: ['Confident', 'Innovative', 'Refuses to write tests'],
    quirk: 'Ships an MVP overnight, refuses to write tests.',
  },
  {
    id: 4, name: 'Leslie K.', experienceYears: 6, availability: 'Immediate',
    skills: ['project-management', 'stakeholder-management', 'public-speaking'],
    flags: ['Tenacious', 'Organized'],
    quirk: 'Has a binder for everything, including the binder.',
  },
  {
    id: 5, name: 'Ron S.', experienceYears: 15, availability: 'Not looking',
    skills: ['woodworking', 'minimalism', 'negotiation'],
    flags: ['Stubborn', 'Principled', 'One-monitor preference'],
    quirk: 'Refuses to use more than one monitor.',
  },
  {
    id: 6, name: 'Rick S.', experienceYears: 20, availability: 'Immediate',
    skills: ['systems-design', 'rapid-prototyping', 'chemistry'],
    flags: ['Genius', 'Reckless', 'Concerning mechanism'],
    quirk: 'Solution works, mechanism deeply concerning.',
  },
  {
    id: 7, name: 'Elle W.', experienceYears: 3, availability: 'Immediate',
    skills: ['persuasion', 'research', 'public-speaking'],
    flags: ['Optimistic', 'Sharp', 'Underestimated in standup'],
    quirk: 'Underestimated in every standup, correct in every retro.',
  },
  {
    id: 8, name: 'MacGyver', experienceYears: 10, availability: '2 weeks',
    skills: ['rapid-prototyping', 'resourcefulness', 'chemistry', 'systems-design'],
    flags: ['Calm', 'Improviser', 'Duct-tape improvisation'],
    quirk: 'Fixes production outages with duct tape and a paperclip metaphor.',
  },

  {
    id: 9, name: 'Sheldon C.', experienceYears: 9, availability: 'Immediate',
    skills: ['theoretical-analysis', 'pattern-recognition', 'research'],
    flags: ['Rigid', 'Brilliant', 'Insufferable'],
    quirk: 'Correct 95% of the time, insufferable 100% of the time.',
  },
  {
    id: 10, name: 'Katniss E.', experienceYears: 5, availability: 'Immediate',
    skills: ['precision', 'strategy', 'crisis-management'],
    flags: ['Resilient', 'Decisive', 'Poor public speaking'],
    quirk: 'Excellent under pressure, terrible with public speaking.',
  },
  {
    id: 11, name: 'Michael S.', experienceYears: 11, availability: 'Not looking',
    skills: ['sales', 'public-speaking', 'team-building'],
    flags: ['Enthusiastic', 'Chaotic', "World's best boss mug"],
    quirk: "World's best boss, according to a mug he bought himself.",
  },
  {
    id: 12, name: 'Olivia P.', experienceYears: 13, availability: '2 weeks',
    skills: ['crisis-management', 'negotiation', 'strategy', 'leadership'],
    flags: ['Decisive', 'Intense'],
    quirk: 'Handles it. Whatever it is.',
  },
  {
    id: 13, name: 'Ted L.', experienceYears: 7, availability: 'Immediate',
    skills: ['team-building', 'optimism', 'mentorship', 'public-speaking'],
    flags: ['Empathetic', 'Persistent', 'Folksy metaphors'],
    quirk: 'Turns every technical setback into a folksy metaphor.',
  },
  {
    id: 14, name: 'Miranda P.', experienceYears: 18, availability: 'Not looking',
    skills: ['leadership', 'negotiation', 'stakeholder-management', 'precision'],
    flags: ['Demanding', 'Decisive', 'Reviews every PR personally'],
    quirk: 'Reviews every PR personally. Says nothing. Everyone panics.',
  },
  {
    id: 15, name: 'Dwight S.', experienceYears: 9, availability: 'Immediate',
    skills: ['sales', 'negotiation', 'security', 'loyalty'],
    flags: ['Intense', 'Loyal', 'Assistant to regional backend engineer'],
    quirk: 'Assistant to the regional backend engineer.',
  },
];

// A job is { id, title, minExperienceYears, skills, cultureKeywords, tagline }.
// Ids are explicit and fixed.
const jobs = [
  {
    id: 1, title: 'Backend Detective', minExperienceYears: 3,
    skills: ['deduction', 'pattern-recognition', 'forensics'],
    cultureKeywords: 'analytical, autonomous',
    tagline: 'We have a bug. We have no leads. We have you.',
  },
  {
    id: 2, title: 'Rapid Prototyping Engineer', minExperienceYears: 2,
    skills: ['rapid-prototyping', 'systems-design'],
    cultureKeywords: 'innovative, fast-paced',
    tagline: 'Ship first, document never (kidding - please document).',
  },
  {
    id: 3, title: 'Developer Relations Lead', minExperienceYears: 2,
    skills: ['public-speaking', 'research'],
    cultureKeywords: 'energetic, curious',
    tagline: 'Explain complex things to confused humans, cheerfully.',
  },
  {
    id: 4, title: 'Engineering Manager, Chaos Team', minExperienceYears: 5,
    skills: ['team-building', 'stakeholder-management', 'leadership'],
    cultureKeywords: 'empathetic, organized',
    tagline: 'Herd cats. The cats are senior engineers.',
  },
  {
    id: 5, title: 'Incident Commander', minExperienceYears: 4,
    skills: ['crisis-management', 'strategy', 'negotiation'],
    cultureKeywords: 'decisive, calm-under-pressure',
    tagline: "3am page. You're the one who picks up.",
  },
  {
    id: 6, title: 'Sales Engineer', minExperienceYears: 3,
    skills: ['sales', 'public-speaking', 'negotiation'],
    cultureKeywords: 'enthusiastic, persistent',
    tagline: 'Sell the vision, then go build it.',
  },
];

module.exports = { flags, candidates, jobs };
