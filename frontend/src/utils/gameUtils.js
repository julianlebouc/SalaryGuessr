// utils/gameUtils.js
const API_URL = process.env.REACT_APP_API_URL;

// ==========================================================
// TEXT PROCESSING
// ==========================================================
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
export function normalizeJob(raw) {
  if (!raw?.id) return null;

  let salary = raw.salary_real ?? null;
  if (!salary && raw.salary_text) {
    const nums = raw.salary_text.replace(/\s/g, "").match(/\d+(?:[.,]\d+)?/g);
    if (nums) {
      const vals = nums.map((n) => parseFloat(n.replace(",", "."))).filter((v) => v > 1000);
      if (vals.length) salary = vals.reduce((a, b) => a + b, 0) / vals.length;
    }
  }

  let cleanedDescription = raw.description ?? "";
  cleanedDescription = cleanedDescription.replace(/<[^>]+>/g, " ").trim();
  cleanedDescription = hideSalaryInText(cleanedDescription);

  return {
    id: raw.id,
    title: raw.intitule ?? "Poste inconnu",
    description: cleanedDescription,
    company: raw.entreprise?.nom ?? null,
    companyDescription: raw.entreprise?.description
      ? raw.entreprise.description.replace(/<[^>]+>/g, "").trim()
      : null,
    location: raw.lieuTravail?.libelle ?? "Localisation inconnue",
    locationCoords: {
      lat: raw.lieuTravail?.latitude,
      lng: raw.lieuTravail?.longitude,
    },
    postalCode: raw.lieuTravail?.codePostal ?? null,
    contractType: raw.typeContratLibelle ?? raw.typeContrat ?? null,
    contractHours: raw.dureeTravailLibelle ?? null,
    natureContrat: raw.natureContrat ?? null,
    experience: raw.experienceLibelle ?? null,
    experienceYears: raw.experienceExige ?? null,
    qualification: raw.qualificationLibelle ?? null,  
    romeCode: raw.romeCode ?? null,
    romeLabel: raw.romeLibelle ?? null,
    appellation: raw.appellationlibelle ?? null,
    sector: raw.secteurActiviteLibelle ?? null,
    naf: raw.codeNAF ?? null,
    alternance: raw.alternance ?? false,
    accessibleTH: raw.accessibleTH ?? false,
    employeurHandiEngage: raw.employeurHandiEngage ?? false,
    nombrePostes: raw.nombrePostes ?? 1,
    created: raw.dateCreation ?? null,
    updated: raw.dateActualisation ?? null,
    offerUrl: raw.origineOffre?.urlOrigine ?? null,
    salary,
    salary_text: raw.salary_text ?? null,
    travailType: raw.dureeTravailLibelleConverti ?? null,
    deplacement: raw.deplacementLibelle ?? null,
    permis: raw.permis ? raw.permis.map(p => p.libelle).join(", ") : null,
  };
}

// ==========================================================
// JOB VALIDATION & FETCHING
// ==========================================================
export function hasValidSalary(job) {
  return job?.salary != null && job.salary > 0;
}

export async function fetchJob() {
  const res = await fetch(`${API_URL}/job`, { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return normalizeJob(data);
}

export async function fetchMultipleJobs(count) {
  const promises = Array.from({ length: count }, () => fetchJob().catch(() => null));
  const results = await Promise.all(promises);
  return results.filter(Boolean);
}

// ==========================================================
// SCORING
// ==========================================================
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
export function formatDate(dateStr) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

// ==========================================================
// HIGH/LOW GAME SPECIFIC (Comparaison de salaires)
// ==========================================================
export function compareSalaries(leftSalary, rightSalary) {
  const isEqual = Math.abs(rightSalary - leftSalary) < 1;
  const isHigher = rightSalary > leftSalary;
  
  return { isEqual, isHigher, isLower: !isHigher };
}

export function evaluateHigherLowerGuess(leftJob, rightJob, guess) {
  if (!leftJob || !rightJob) return false;
  
  const { isEqual, isHigher } = compareSalaries(leftJob.salary, rightJob.salary);
  
  if (isEqual) return true;
  
  if (guess === "higher") return isHigher;
  if (guess === "lower") return !isHigher;
  
  return false;
}