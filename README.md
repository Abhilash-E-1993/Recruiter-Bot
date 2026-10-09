# Recruiter Bot

**A CLI-based recruiter bot that ranks candidates — and shows you exactly why.**

Recruiter Bot matches 15 candidates to 6 open roles, in both directions
(best candidates for a job, best jobs for a candidate). It runs as an
interactive terminal app — the main demo — and also exposes the same matching
through a tiny REST API. Every match comes with a score, the full maths behind
it, and a one-paragraph plain-English reason. No black box.

Built with plain JavaScript, Express and SQLite. No Docker, no cloud database,
no `.env` file.

## Setup — three commands

Requires Node.js 18 or newer.

```
npm install
npm run setup
npm run cli
```

1. `npm install` — installs the dependencies.
2. `npm run setup` — creates the SQLite file and loads the demo data
   (15 candidates, 6 jobs; takes a second and is safe to re-run).
3. `npm run cli` — starts the terminal app.

Prefer the API? `npm start` (port 3000; set `PORT` to change it).
Run the tests with `npm test`.

Troubleshooting: if `npm install` warns that it blocked the install script of
`better-sqlite3`, run `npm install-scripts approve better-sqlite3` and then
`npm rebuild better-sqlite3` once.

## Try the API (with the output you should see)

Start it first with `npm start`. Even without running anything, the examples
below show the real responses.

### 1. Rank candidates for a job

```
curl http://localhost:3000/jobs/1/matches
```

Top of the real response (trimmed — 11 candidates are returned, best first):

```json
{
  "preferences": { "priority": "none", "overqualification": "penalize", "availability": "default" },
  "includeUnavailable": false,
  "job": { "id": 1, "title": "Backend Detective", "minExperienceYears": 3, "...": "..." },
  "matches": [
    {
      "rank": 1,
      "candidate": { "id": 1, "name": "Sherlock H.", "experienceYears": 8, "availability": "Immediate" },
      "score": 76,
      "skillMatchPercentage": 100,
      "matchedSkills": ["deduction", "forensics", "pattern-recognition"],
      "missingSkills": [],
      "experienceFit": "overqualified",
      "breakdown": { "skillPoints": 60, "experiencePoints": 14, "availabilityMultiplier": 1, "flagScore": 2 },
      "reason": "Matches 100% of the required skills. Available immediately. Exceeds the experience range and may be overqualified. Analytical positively affects the score, while Insufferable slightly reduces it."
    }
  ]
}
```

### 2. The other direction — rank jobs for a candidate

```
curl http://localhost:3000/candidates/1/matches
```

Backend Detective comes first, score 76.

### 3. Customized ranking via query parameters

```
curl "http://localhost:3000/jobs/1/matches?priority=skills&overqualification=allow&availability=include_low"
```

Sherlock first with score 107, and 15 matches (the `include_low` row lets
Not-looking candidates appear at a reduced weight).

| Parameter | Values | Default |
| --- | --- | --- |
| `priority` | `none`, `skills`, `experience` | `none` |
| `overqualification` | `penalize`, `allow` | `penalize` |
| `availability` | `default`, `include_low`, `include_fair` | `default` |
| `includeUnavailable` | `true` to show Not-looking candidates | (false) |

### 4. Clear errors, never a crash

```
curl http://localhost:3000/jobs/999/matches
```
```json
{ "error": "Job 999 not found" }
```
404 — the id is valid but unknown.

```
curl "http://localhost:3000/jobs/abc/matches"
```
```json
{ "error": "id must be a positive whole number" }
```
400 — the id itself is invalid.

```
curl "http://localhost:3000/jobs/1/matches?priority=everything"
```
```json
{ "error": "priority must be one of: none, skills, experience" }
```
400 — the message always lists the accepted values. Unknown routes return
404 `{ "error": "Route not found" }`.

## How it works, in plain language

1. **You answer four quick questions** (arrow keys, no typing): generalized or
   customized ranking; whether skills or experience should matter more; whether
   far-above-the-requirement experience is a good thing; and whether candidates
   who are not currently looking should appear at all.
2. **You pick a job (or a candidate)** from an arrow-key list.
3. **The app loads every candidate from the database, scores each one against
   the job with one formula, sorts best first, and prints a ranked table** —
   followed by explanation cards for the top 3 that show the reason and the
   maths of each score.
4. **The REST API does exactly the same thing through URLs.** Both front doors
   call the same matching code, so the algorithm exists exactly once.

Under the hood it is a simple pipeline: the terminal/HTTP layer only collects
input, the matching service only scores and sorts, the model files only run
small hand-written SQL queries, and the scoring maths lives in one pure file
that never touches the database.

## The scoring algorithm — the heart of the project

```
finalScore = (skillPoints + experiencePoints) x availabilityMultiplier + flagScore
```

### 1. Skill points (0 to 60)

`60 x (matched required skills / total required skills)`. Matching 2 of 3
required skills earns 40. Choosing "skills matter most" raises the cap from 60
to 80, so skill evidence dominates the ranking.

### 2. Experience points — a curve, not a straight line

| Years above the requirement | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7+ |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Points | 20 | 23 | **25** | 22 | 18 | 14 | 10 | 5 |

- The curve **peaks at 2 years above the requirement** — the sweet spot: proven
  ability, still room to grow into the role.
- **Below the requirement** the points are prorated (`20 x years / required`)
  and the match is labelled `underqualified`.
- **4 or more years above** is labelled `overqualified` under the default
  policy; the customized "more experience is always valuable" answer flattens
  the curve to a full 25 and never applies the label.
- "Experience matters most" multiplies these points by 1.6.

**Then the whole experience component is multiplied by the skill match
fraction.** Experience only counts in proportion to relevant skills: a 100%
skill match keeps full points, 50% keeps half, 0% keeps none. Nobody can rank
high on years alone.

### 3. Availability multiplier

| Immediate | 2 weeks | Not looking |
| --- | --- | --- |
| x1.00 | x1.00 | hidden — or x0.25 / x0.50 if the recruiter includes them |

Two weeks' notice is not a real delay, so it is not penalized — Immediate and
2 weeks count equally. Candidates who are Not looking are **hidden by
default**; they appear only when the recruiter opts in (the Step 4 question, or
`includeUnavailable=true` / `availability=include_low|include_fair` in the API).

### 4. Flag score — the personality nudge

Every candidate carries personality flags: **green +2, yellow +1, red -1**.
They are summed and **added at the very end, after the multiplication**, so
personality can break a tie or nudge an ordering but can never outweigh skills,
experience and availability.

### 5. Tie-breaks — fully deterministic, no randomness

Equal scores are broken by: higher skill match %, then higher experience
points, then better availability (Immediate over 2 weeks over Not looking),
then lower id.

### Worked example

Sherlock H. vs Backend Detective (needs 3+ years; requires deduction,
forensics, pattern-recognition):

- Skills: 3 of 3 matched → 100% → **60** points
- Experience: 8 years is 5 above the minimum → curve gives 14, x 100% skill
  fraction → **14** points (fit label: overqualified)
- Availability: Immediate → **x1.00**
- Flags: Analytical +2, Blunt +1, Insufferable -1 → **+2**
- **(60 + 14) x 1.00 + 2 = 76.00**

The same match under "skills matter most" + "more experience is always
valuable": (80 + 25) x 1.00 + 2 = **107.00**.


## Design decisions & trade-offs

Every scoring rule is an opinion. Here is what we chose, why, and what we
knowingly gave up — the customized questions exist precisely so the recruiter
can override the opinions they disagree with.

**Personality traits and quirks are stored as flags with fixed scores.**
"Stubborn", for example, is a red flag (-1). In real life, stubbornness is
often exactly what gets a hard project shipped — the catalog is a simplified,
opinionated starting point. Because flag scores live in one database row per
flag, re-valuing a trait is a one-row change, not a rewrite.

**Overqualified candidates are penalized by default.** The experience curve
peaks at 2 years above the requirement and then falls. Sometimes 20 years of
experience is exactly what a role needs, and our default would mark that
candidate down — so customized mode offers "more experience is always
valuable", which removes the penalty entirely.

**Not-looking candidates are hidden by default.** People who cannot be hired
should not clutter a ranking. The trade-off: a great "not looking" candidate
might still be convincible — that is what `includeUnavailable=true` and the
x0.25 / x0.50 inclusion modes are for.

**SQLite, one local file.** The interviewer runs three commands and everything
works — no Docker, no cloud database, no credentials. The trade-off is that
this is a demo-scale choice, not a production-scale one.

**Culture fit is stored but not scored.** Jobs carry culture keywords and
candidates carry trait flags, but we deliberately did not let "culture" add
points — culture fit is real, yet it is also where bias creeps in, so evidence
(skills, experience, availability) decides the ranking and personality only
nudges it. The data model already supports scoring culture later if desired.

**Scores are computed per request; there is no matches table.** A score
depends on the candidate, the job and the recruiter's current preferences, so
storing it would just let it go stale. At this data size a JavaScript loop is
instant; at scale we would pre-filter by skill overlap in SQL or cache results.

**Generalized by default, customized on request.** The default profile keeps
the demo one Enter key away, while the four questions reduce the ambiguity of
"what does a good match mean for *this* role?" without forcing every user
through setup.

## Known limitations

- Matching loads all candidates (or all jobs) and loops in JavaScript — fine
  for 15 rows; at scale, filter by skill overlap in SQL or cache results.
- The weights (60/80 skill cap, the 1.6 experience scale, the curve, the 0.25 /
  0.5 inclusion multipliers) are deliberate, tunable design choices, all kept
  at the top of `src/services/scoring.js`.
- A candidate with 0% of the required skills still appears in the list (with a
  low, flags-driven score) rather than being removed entirely.

## Tests

`npm test` runs 23 tests on the pure scoring and reason functions — the golden
scores above, the experience curve, the availability rows, the visibility rule
and the explanation sentences. No database needed.

## How AI was used

I decided the design — scoring rules, weights, architecture and trade-offs —
then used **Claude AI** to refine those decisions into a clear spec
(`spec.txt`), and **Cline** to implement the code from that spec. I reviewed
the output and used the tests to verify it behaved the way I intended.

