import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import HighLowGame from '../pages/HighLowGame';
import { vi, describe, test, expect, beforeEach } from 'vitest';
import * as gameUtils from '../utils/gameUtils';

vi.mock('../sound/SoundProvider', () => ({
  useSound: () => ({ play: vi.fn() }),
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
    vi.spyOn(gameUtils, 'evaluateHigherLowerGuess').mockReturnValue(true);

    await act(async () => {
      render(
        <MemoryRouter>
          <HighLowGame />
        </MemoryRouter>
      );
    });

    await waitFor(() => screen.getByText(/Job A/i));

    const higherBtn = screen.getByText(/PLUS ÉLEVÉ/i);
    
    await act(async () => {
      fireEvent.click(higherBtn);
    });

    // Score should increment
    expect(screen.getByText(/Score/i).parentElement).toHaveTextContent('1');
    expect(screen.getByText(/✅/i)).toBeInTheDocument();
  });

  test('wrong guess ends the game', async () => {
    vi.spyOn(gameUtils, 'evaluateHigherLowerGuess').mockReturnValue(false);

    await act(async () => {
      render(
        <MemoryRouter>
          <HighLowGame />
        </MemoryRouter>
      );
    });

    await waitFor(() => screen.getByText(/Job A/i));

    const higherBtn = screen.getByText(/PLUS ÉLEVÉ/i);
    
    await act(async () => {
      fireEvent.click(higherBtn);
    });

    expect(screen.getByText(/❌/i)).toBeInTheDocument();

    // Wait for the timeout in the component (1500ms)
    await waitFor(() => {
      expect(screen.getByText(/GAME OVER/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});
