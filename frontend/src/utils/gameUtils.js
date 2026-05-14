const API_URL = process.env.REACT_APP_API_URL;

// ==========================================================
// TEXT PROCESSING
// ==========================================================
/**
 * @module Utils/gameUtils
 */

/**
 * Replace salary numbers in text with masked dots while preserving surrounding context.
 * @param {string} text
 * @returns {string}
 */
export function hideSalaryInText(text) {
  if (!text) return text;

  let result = text;
  const currencyRegex = /€|euro|euros/gi;
  let match;

  while ((match = currencyRegex.exec(text)) !== null) {
    const position = match.index;
    const start = Math.max(0, position - 20);
    const end = Math.min(text.length, position + 20);

    const beforeMatch = result.substring(start, position);
    const afterMatch = result.substring(position, end);

    let censoredBefore = beforeMatch.replace(/\d+(?:[.,]\d+)?/g, (nums) => '•'.repeat(nums.length));
    let censoredAfter = afterMatch.replace(/\d+(?:[.,]\d+)?/g, (nums) => '•'.repeat(nums.length));

    result = result.substring(0, start) + censoredBefore + censoredAfter + result.substring(end);
  }

  return result;
}

// ==========================================================
// JOB NORMALIZATION
// ==========================================================
/**
 * Normalize raw job data into the frontend job model.
 * @param {object} raw
 * @returns {object|null}
 */
export function normalizeJob(raw) {
  if (!raw?.id) return null;

  // Most normalization is now done on the backend.
  // We just ensure salary is mapped correctly for legacy compatibility.
  return {
    ...raw,
    salary: raw.salary_real ?? null,
  };
}

// ==========================================================
// JOB VALIDATION & FETCHING
// ==========================================================
/**
 * Check whether a normalized job has a valid salary value.
 * @param {object} job
 * @returns {boolean}
 */
export function hasValidSalary(job) {
  // Since salary is hidden for anti-cheat, we trust the backend 
  // only sends jobs that have a valid (but hidden) salary.
  return job?.id != null;
}

/**
 * Fetch a single normalized job from the API.
 * @returns {Promise<object>}
 */
export async function fetchJob() {
  const res = await fetch(`${API_URL}/job`, { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return normalizeJob(data);
}

/**
 * Fetch multiple jobs concurrently and return only successful results.
 * @param {number} count
 * @returns {Promise<object[]>}
 */
export async function fetchMultipleJobs(count) {
  const promises = Array.from({ length: count }, () => fetchJob().catch(() => null));
  const results = await Promise.all(promises);
  return results.filter(Boolean);
}

/**
 * Validate a salary guess with the backend (Anti-Cheat).
 * @param {string} jobId 
 * @param {number} guess 
 * @returns {Promise<object>}
 */
export async function validateGuess(jobId, guess) {
  const res = await fetch(`${API_URL}/validate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ job_id: jobId, guess: Number(guess) }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}

/**
 * Validate a higher/lower comparison between two jobs (Anti-Cheat).
 * @param {string} jobIdToGuess 
 * @param {string} knownJobId 
 * @param {string} guess "higher" or "lower"
 * @returns {Promise<object>}
 */
export async function validateComparison(jobIdToGuess, knownJobId, guess) {
  const res = await fetch(`${API_URL}/validate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      job_id: jobIdToGuess,
      other_job_id: knownJobId,
      guess
    }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}

// ==========================================================
// SCORING
// ==========================================================
/**
 * Calculate a score based on the user's estimate versus the real salary.
 * @param {number} estimated
 * @param {number} real
 * @returns {{score:number,error:number,errorRatio:number}}
 */
export function calculateScore(estimated, real) {
  if (!Number.isFinite(real) || real <= 0 || !Number.isFinite(estimated) || estimated <= 0) {
    return 0;
  }

  const errorRatio = Math.abs(estimated - real) / real;
  let roundScore = 0;

  if (errorRatio <= 0.5) {
    const x = errorRatio / 0.5;
    roundScore = 100 * Math.pow(1 - x, 2);
  }

  return {
    score: roundScore,
    error: errorRatio * 100,
    errorRatio
  };
}

// ==========================================================
// DATE FORMATTING
// ==========================================================
/**
 * Format an ISO date string using French locale formatting.
 * @param {string} dateStr
 * @returns {string|null}
 */
export function formatDate(dateStr) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

// ==========================================================
// HIGH/LOW GAME SPECIFIC (Salary comparison)
// ==========================================================
/**
 * Compare two salary values and return relative comparison results.
 * @param {number} leftSalary
 * @param {number} rightSalary
 * @returns {{isEqual:boolean,isHigher:boolean,isLower:boolean}}
 */
export function compareSalaries(leftSalary, rightSalary) {
  const isEqual = Math.abs(rightSalary - leftSalary) < 1;
  const isHigher = rightSalary > leftSalary;

  return { isEqual, isHigher, isLower: !isHigher };
}

/**
 * Evaluate a higher/lower guess for two job offers.
 * @param {object} leftJob
 * @param {object} rightJob
 * @param {string} guess
 * @returns {boolean}
 */
export function evaluateHigherLowerGuess(leftJob, rightJob, guess) {
  if (!leftJob || !rightJob) return false;

  const { isEqual, isHigher } = compareSalaries(leftJob.salary, rightJob.salary);

  if (isEqual) return true;

  if (guess === "higher") return isHigher;
  if (guess === "lower") return !isHigher;

  return false;
}