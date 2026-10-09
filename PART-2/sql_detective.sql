/*
SQL Detective Challenge — Part 2

Notes:
- The queries use straightforward SQL that should work in SQLite and most common SQL databases.
- Each question includes its interpretation and any important assumption.
- Question 3 has a genuine schema limitation: there is no direct application-to-job table.
*/


-- Question 1
-- List all currently open job postings with the recruiter who owns each one.
--
-- Ambiguity:
-- None that materially affects this query. The status column explicitly marks open jobs.
--
-- Assumption:
-- "Currently open" means status = 'open' in the supplied data.

SELECT
    job_postings.title,
    recruiters.name AS recruiter_name
FROM job_postings
JOIN recruiters
    ON job_postings.recruiter_id = recruiters.id
WHERE job_postings.status = 'open';


-- Question 2
-- For each job posting, count applicants who reached the Final interview stage.
--
-- Ambiguity:
-- "Reached Final" could mean a Final interview was scheduled/recorded, or that the
-- applicant passed earlier stages. The data does not define this more narrowly.
--
-- Assumption:
-- Count each distinct applicant who has a recorded interview with stage = 'Final',
-- regardless of the Final interview outcome. LEFT JOIN keeps jobs with zero Final
-- interviews in the results.

SELECT
    job_postings.id AS job_id,
    job_postings.title,
    COUNT(DISTINCT interviews.applicant_id) AS final_stage_applicants
FROM job_postings
LEFT JOIN interviews
    ON job_postings.id = interviews.job_posting_id
    AND interviews.stage = 'Final'
GROUP BY
    job_postings.id,
    job_postings.title;


-- Question 3
-- Find every person who effectively applied to more than one job posting.
--
-- Important ambiguity / data limitation:
-- applicants has no job_posting_id, and there is no separate applications table.
-- The only available link between an applicant and a job is through interviews.
-- Therefore, this query can only find people associated with multiple jobs in the
-- interview records; it cannot find applications that never resulted in an interview.
--
-- Identity assumption:
-- Treat records with the same email ignoring capitalization as the same person.
-- This handles Ananya Rao's two differently capitalized email values, but matching
-- email capitalization alone cannot prove that two records are the same person.
--
-- The query counts distinct job postings associated with those email groups.

SELECT
    LOWER(applicants.email) AS normalized_email,
    MIN(applicants.full_name) AS applicant_name,
    COUNT(DISTINCT interviews.job_posting_id) AS jobs_seen_in_interviews
FROM applicants
JOIN interviews
    ON applicants.id = interviews.applicant_id
GROUP BY
    LOWER(applicants.email)
HAVING COUNT(DISTINCT interviews.job_posting_id) > 1;


-- Question 4
-- For each recruiter, calculate Final-stage conversion rate:
-- passed Final interviews / all Final interviews.
-- Include recruiters with at least 3 Final-stage interviews.
--
-- Ambiguity:
-- A NULL outcome is pending. The question does not say whether pending Final
-- interviews should be excluded from the denominator.
--
-- Assumption:
-- Include every recorded Final interview in the denominator, including pending
-- interviews; count only outcome = 'passed' in the numerator. The HAVING condition
-- applies to the total number of Final interview records.
--
-- The result is expressed as a percentage.

SELECT
    recruiters.name AS recruiter_name,
    COUNT(*) AS total_final_interviews,
    SUM(CASE WHEN interviews.outcome = 'passed' THEN 1 ELSE 0 END)
        AS passed_final_interviews,
    100.0 * SUM(CASE WHEN interviews.outcome = 'passed' THEN 1 ELSE 0 END)
        / COUNT(*) AS conversion_rate_percent
FROM recruiters
JOIN job_postings
    ON recruiters.id = job_postings.recruiter_id
JOIN interviews
    ON job_postings.id = interviews.job_posting_id
WHERE interviews.stage = 'Final'
GROUP BY
    recruiters.id,
    recruiters.name
HAVING COUNT(*) >= 3;


-- Question 5 (Bonus)
-- Using a window function, find the recruiter with the most successful placements
-- per department.
--
-- Ambiguity:
-- A passed Final interview is not necessarily proof that the person was hired.
-- The data has no hiring/offer/placement table. Also, more than one recruiter can
-- tie for the highest count.
--
-- Assumption:
-- Treat outcome = 'passed' at the Final stage as a successful placement.
-- ROW_NUMBER() returns one recruiter per department; if counts tie, recruiter name
-- is used as a consistent tie-breaker. If all tied recruiters should be returned,
-- RANK() could be used instead.

WITH recruiter_placements AS (
    SELECT
        job_postings.department,
        recruiters.id AS recruiter_id,
        recruiters.name AS recruiter_name,
        COUNT(*) AS successful_placements
    FROM recruiters
    JOIN job_postings
        ON recruiters.id = job_postings.recruiter_id
    JOIN interviews
        ON job_postings.id = interviews.job_posting_id
    WHERE interviews.stage = 'Final'
      AND interviews.outcome = 'passed'
    GROUP BY
        job_postings.department,
        recruiters.id,
        recruiters.name
),
ranked_placements AS (
    SELECT
        department,
        recruiter_name,
        successful_placements,
        ROW_NUMBER() OVER (
            PARTITION BY department
            ORDER BY successful_placements DESC, recruiter_name
        ) AS rank_no
    FROM recruiter_placements
)
SELECT
    department,
    recruiter_name,
    successful_placements
FROM ranked_placements
WHERE rank_no = 1;
