import { 
  hideSalaryInText, 
  calculateScore, 
  normalizeJob, 
  compareSalaries,
  formatDate,
  evaluateHigherLowerGuess,
  fetchJob,
  fetchMultipleJobs
} from '../utils/gameUtils';
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';

describe('gameUtils - hideSalaryInText', () => {
  test('should mask numbers near currency keywords', () => {
    const text = "Salaire de 3500 euros par mois";
    const masked = hideSalaryInText(text);
    expect(masked).toContain('••••');
    expect(masked).not.toContain('3500');
  });

  test('should mask decimal numbers', () => {
    const text = "2500,50 €";
    const masked = hideSalaryInText(text);
    expect(masked).toContain('•••••');
  });
});

describe('gameUtils - calculateScore', () => {
  test('should return 100 for perfect guess', () => {
    const result = calculateScore(3000, 3000);
    expect(result.score).toBe(100);
  });

  test('should return 0 for guesses too far away', () => {
    const result = calculateScore(6000, 3000);
    expect(result.score).toBe(0);
  });

  test('should handle invalid inputs', () => {
    expect(calculateScore(0, 3000)).toBe(0);
  });
});

describe('gameUtils - normalizeJob', () => {
  test('should correctly map raw fields', () => {
    const raw = {
      id: "abc",
      intitule: "Dev",
      salary_real: 3500,
      lieuTravail: { libelle: "Paris" }
    };
    const job = normalizeJob(raw);
    expect(job.title).toBe("Dev");
    expect(job.salary).toBe(3500);
    expect(job.location).toBe("Paris");
  });

  test('should handle missing data gracefully', () => {
    const job = normalizeJob({});
    expect(job).toBeNull();
  });
});

describe('gameUtils - compareSalaries', () => {
  test('should correctly identify higher salary', () => {
    const result = compareSalaries(2000, 3000);
    expect(result.isHigher).toBe(true);
    expect(result.isLower).toBe(false);
  });

  test('should handle equality with small threshold', () => {
    const result = compareSalaries(1000.5, 1000.6);
    expect(result.isEqual).toBe(true);
  });
});

describe('gameUtils - formatDate', () => {
  test('should format ISO date to French', () => {
    const result = formatDate("2024-05-01T10:00:00Z");
    expect(result).toContain("2024");
  });

  test('should return null for empty input', () => {
    expect(formatDate(null)).toBeNull();
  });
});

describe('gameUtils - evaluateHigherLowerGuess', () => {
  test('should return true for correct higher guess', () => {
    const left = { salary: 2000 };
    const right = { salary: 3000 };
    expect(evaluateHigherLowerGuess(left, right, 'higher')).toBe(true);
  });

  test('should return true for correct lower guess', () => {
    const left = { salary: 3000 };
    const right = { salary: 2000 };
    expect(evaluateHigherLowerGuess(left, right, 'lower')).toBe(true);
  });

  test('should return true for equality regardless of guess', () => {
    const left = { salary: 2500 };
    const right = { salary: 2500 };
    expect(evaluateHigherLowerGuess(left, right, 'higher')).toBe(true);
  });
});

describe('gameUtils - fetch API', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test('fetchJob should return normalized job', async () => {
    const mockResponse = {
      ok: true,
      json: () => Promise.resolve({
        id: "123",
        intitule: "Backend Dev",
        salary_real: 4000
      })
    };
    fetch.mockResolvedValue(mockResponse);

    const job = await fetchJob();
    expect(job.id).toBe("123");
    expect(job.salary).toBe(4000);
  });

  test('fetchJob should throw on error', async () => {
    fetch.mockResolvedValue({ ok: false, status: 500 });
    await expect(fetchJob()).rejects.toThrow("HTTP 500");
  });

  test('fetchMultipleJobs should return list of valid jobs', async () => {
    const mockJob = { id: "1", intitule: "Job" };
    fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockJob)
    });

    const jobs = await fetchMultipleJobs(2);
    expect(jobs.length).toBe(2);
    expect(jobs[0].id).toBe("1");
  });
});
