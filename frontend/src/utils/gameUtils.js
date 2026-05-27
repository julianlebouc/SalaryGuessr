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
 * @param {string} [language="fr"] - "fr" or "en"
 * @returns {Promise<object>}
 */
export async function fetchJob(language = "fr") {
  const res = await fetch(`${API_URL}/job?language=${language}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return normalizeJob(data);
}

/**
 * Fetch multiple jobs concurrently and return only successful results.
 * @param {number} count
 * @param {string} [language="fr"] - "fr" or "en"
 * @returns {Promise<object[]>}
 */
export async function fetchMultipleJobs(count, language = "fr") {
  const promises = Array.from({ length: count }, () => fetchJob(language).catch(() => null));
  const results = await Promise.all(promises);
  return results.filter(Boolean);
}

/**
 * Start a new anti-cheat game session on the server.
 * @param {"classic"|"highlow"} mode
 * @param {string} [language="fr"] - "fr" or "en"
 * @returns {Promise<string>} The session_token to include in validate calls.
 */
export async function startSession(mode, language = "fr") {
  try {
    const res = await fetch(`${API_URL}/session/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode, language }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.session_token ?? null;
  } catch {
    return null;
  }
}

/**
 * Finalize a game session. Server computes the authoritative score and logs it.
 * @param {string} sessionToken
 * @returns {Promise<object|null>} { mode, score } or null on failure.
 */
export async function reportGameOver(sessionToken) {
  if (!sessionToken) return null;
  try {
    const res = await fetch(`${API_URL}/game_over`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_token: sessionToken }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Validate a salary guess with the backend (Anti-Cheat).
 * @param {string} jobId
 * @param {number} guess
 * @param {string|null} sessionToken
 * @returns {Promise<object>}
 */
export async function validateGuess(jobId, guess, sessionToken = null) {
  const body = { job_id: jobId };
  if (guess !== undefined && guess !== null) body.guess = Number(guess);
  if (sessionToken) body.session_token = sessionToken;

  const res = await fetch(`${API_URL}/validate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}

/**
 * Validate a higher/lower comparison between two jobs (Anti-Cheat).
 * @param {string} jobIdToGuess
 * @param {string} knownJobId
 * @param {string} guess "higher" or "lower"
 * @param {string|null} sessionToken
 * @returns {Promise<object>}
 */
export async function validateComparison(jobIdToGuess, knownJobId, guess, sessionToken = null) {
  const body = {
    job_id: jobIdToGuess,
    other_job_id: knownJobId,
    guess,
  };
  if (sessionToken) body.session_token = sessionToken;

  const res = await fetch(`${API_URL}/validate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
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

// ==========================================================
// LEADERBOARD API
// ==========================================================
/**
 * Fetch the top 3 leaderboard entries for all modes.
 * @returns {Promise<object|null>} { classic: Array, highlow: Array } or null on failure.
 */
export async function fetchLeaderboard() {
  try {
    const res = await fetch(`${API_URL}/api/leaderboard`, { cache: "no-store" });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Submit a top 3 score securely using the completed session token.
 * @param {string} sessionToken
 * @param {string} pseudo
 * @returns {Promise<object|null>} The result or null on failure.
 */
export async function submitLeaderboardScore(sessionToken, pseudo) {
  if (!sessionToken || !pseudo) return null;
  try {
    const res = await fetch(`${API_URL}/api/leaderboard/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_token: sessionToken, pseudo }),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.detail || `HTTP ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    console.error("Score submission failed:", err);
    throw err;
  }
}