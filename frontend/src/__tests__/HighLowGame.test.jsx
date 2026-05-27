import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import HighLowGame from '../pages/HighLowGame';
import { vi, describe, test, expect, beforeEach } from 'vitest';
import * as gameUtils from '../utils/gameUtils';

vi.mock('../sound/SoundProvider', () => ({
  useSound: () => ({ play: vi.fn() }),
}));

vi.mock('../context/SettingsContext', () => ({
  useSettings: () => ({
    volume: 0.5,
    setVolume: vi.fn(),
    salaryType: 'brut',
    salaryPeriod: 'monthly',
    language: 'fr',
    convertToBase: (val) => val,
    convertFromBase: (val) => val,
    getSalaryLabel: (lang) => (lang === 'en' ? 'Gross Monthly' : 'Brut Mensuel'),
  }),
}));

describe('HighLowGame Component', () => {
  const mockJobs = [
    { id: '1', title: 'Job A', salary: 2000, company: 'C1', location: 'L1' },
    { id: '2', title: 'Job B', salary: 3000, company: 'C2', location: 'L2' },
    { id: '3', title: 'Job C', salary: 2500, company: 'C3', location: 'L3' },
    { id: '4', title: 'Job D', salary: 4000, company: 'C4', location: 'L4' },
    { id: '5', title: 'Job E', salary: 3500, company: 'C5', location: 'L5' },
  ];

  beforeEach(() => {
    vi.spyOn(gameUtils, 'fetchMultipleJobs').mockResolvedValue(mockJobs);
    vi.spyOn(gameUtils, 'fetchJob').mockResolvedValue({ id: '6', title: 'Job F', salary: 5000 });
    vi.spyOn(gameUtils, 'validateGuess').mockResolvedValue({ real_salary: 2000 });
    vi.spyOn(gameUtils, 'validateComparison').mockResolvedValue({ correct: true, real_salary: 3000 });
  });

  test('starts game and shows jobs', async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <HighLowGame />
        </MemoryRouter>
      );
    });
    
    await waitFor(() => {
      expect(screen.getByText(/Job A/i)).toBeInTheDocument();
      expect(screen.getByText(/Job B/i)).toBeInTheDocument();
    });
  });

  test('correct guess increments score and moves to next round', async () => {
    vi.spyOn(gameUtils, 'validateComparison').mockResolvedValue({ correct: true, real_salary: 3000 });

    await act(async () => {
      render(
        <MemoryRouter>
          <HighLowGame />
        </MemoryRouter>
      );
    });

    await waitFor(() => screen.getByText(/Job A/i));

    const higherBtn = screen.getByRole('button', { name: /PLUS/i });
    
    await act(async () => {
      fireEvent.click(higherBtn);
    });

    // Score should increment
    expect(screen.getByText(/SÉRIE ACTUELLE/i).nextSibling).toHaveTextContent('1');
  });

  test('wrong guess ends the game', async () => {
    vi.spyOn(gameUtils, 'validateComparison').mockResolvedValue({ correct: false, real_salary: 1000 });

    await act(async () => {
      render(
        <MemoryRouter>
          <HighLowGame />
        </MemoryRouter>
      );
    });

    await waitFor(() => screen.getByText(/Job A/i));

    const higherBtn = screen.getByRole('button', { name: /PLUS/i });
    
    await act(async () => {
      fireEvent.click(higherBtn);
    });

    // Wait for the timeout in the component (1500ms)
    await waitFor(() => {
      expect(screen.getByText(/PARTIE TERMINÉE/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  test('correct lower guess increments score', async () => {
    vi.spyOn(gameUtils, 'validateComparison').mockResolvedValue({ correct: true, real_salary: 1500 });

    await act(async () => {
      render(
        <MemoryRouter>
          <HighLowGame />
        </MemoryRouter>
      );
    });

    await waitFor(() => screen.getByText(/Job A/i));

    const lowerBtn = screen.getByRole('button', { name: /MOINS/i });
    
    await act(async () => {
      fireEvent.click(lowerBtn);
    });

    expect(screen.getByText(/SÉRIE ACTUELLE/i).nextSibling).toHaveTextContent('1');
  });
});
