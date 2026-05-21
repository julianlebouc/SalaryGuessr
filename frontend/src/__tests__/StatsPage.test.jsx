import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import StatsPage from '../pages/StatsPage';
import { vi, describe, test, expect, beforeEach, afterEach } from 'vitest';
import { fetchLeaderboard } from '../utils/gameUtils';

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }) => <div data-testid="chart">{children}</div>,
  BarChart: ({ children }) => <div>{children}</div>,
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
}));

vi.mock('../utils/gameUtils', () => ({
  fetchLeaderboard: vi.fn(),
}));

describe('StatsPage Component', () => {
  const mockStatsData = {
    unique_sessions_count: 42,
    total_games_played: 137,
    daily_activity: [
      { day: '2026-05-19', count: 12 },
      { day: '2026-05-20', count: 25 },
    ],
    modes: {
      classic: {
        avg_score: 72.4,
        max_score: 95.8,
      },
      highlow: {
        avg_score: 8.3,
        max_score: 21,
      },
    },
  };

  const mockLeaderboardData = {
    classic: [
      { pseudo: 'Alice', score: 95.8, date: '2026-05-20' },
      { pseudo: 'Bob', score: 92.1, date: '2026-05-19' },
    ],
    highlow: [
      { pseudo: 'Charlie', score: 21, date: '2026-05-20' },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock the global fetch for global stats
    global.fetch = vi.fn().mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockStatsData),
      })
    );

    // Mock fetchLeaderboard
    vi.mocked(fetchLeaderboard).mockResolvedValue(mockLeaderboardData);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('renders loading screen initially', async () => {
    render(
      <MemoryRouter>
        <StatsPage />
      </MemoryRouter>
    );
    expect(screen.getByText(/Chargement\.\.\./i)).toBeInTheDocument();

    // Wait for async state updates to resolve to prevent act() warnings
    await waitFor(() => {
      expect(screen.queryByText(/Chargement\.\.\./i)).not.toBeInTheDocument();
    });
  });

  test('renders stats data and leaderboard entries after loading', async () => {
    render(
      <MemoryRouter>
        <StatsPage />
      </MemoryRouter>
    );

    // Wait for loading to finish and stats elements to appear
    await waitFor(() => {
      expect(screen.getByText('42')).toBeInTheDocument(); // unique visitors
      expect(screen.getByText('137')).toBeInTheDocument(); // games played
    });

    // Check classic avg and record scores
    expect(screen.getByText('72.4')).toBeInTheDocument();
    expect(screen.getByText('95.8')).toBeInTheDocument();

    // Check highlow avg and record scores
    expect(screen.getByText('8.3')).toBeInTheDocument();
    expect(screen.getAllByText('21')[0]).toBeInTheDocument();

    // Check all-time leaderboard sections exist
    expect(screen.getByText('Records - Classique')).toBeInTheDocument();
    expect(screen.getByText('Records - High / Low')).toBeInTheDocument();

    // Check leaderboard players are rendered
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('Charlie')).toBeInTheDocument();

    // Check classic leaderboard scores are formatted
    expect(screen.getByText('95.8 PTS')).toBeInTheDocument();
    expect(screen.getByText('92.1 PTS')).toBeInTheDocument();

    // Check highlow leaderboard score is formatted
    expect(screen.getAllByText('21')[1]).toBeInTheDocument();
  });

  test('renders empty message when no leaderboard scores are available', async () => {
    vi.mocked(fetchLeaderboard).mockResolvedValue({ classic: [], highlow: [] });

    render(
      <MemoryRouter>
        <StatsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('42')).toBeInTheDocument();
    });

    const emptyMsgs = screen.getAllByText('Aucun score enregistré');
    expect(emptyMsgs.length).toBe(2);
  });
});
