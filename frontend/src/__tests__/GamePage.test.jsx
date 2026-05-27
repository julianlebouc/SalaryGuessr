import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import GamePage from '../pages/GamePage';
import { vi, describe, test, expect } from 'vitest';

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }) => <div data-testid="chart">{children}</div>,
  BarChart: ({ children }) => <div>{children}</div>,
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
  Legend: () => null,
}));

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

vi.mock('../utils/gameUtils', () => ({
  fetchJob: vi.fn(() => Promise.resolve({
    id: "123",
    title: "Mock Job",
    salary: 4000,
    company: "Test Co",
    location: "Paris",
    description: "Job description here"
  })),
  hasValidSalary: vi.fn(() => true),
  validateGuess: vi.fn(() => Promise.resolve({ score: 90, real_salary: 4000 })),
  startSession: vi.fn(() => Promise.resolve("mock-session-token")),
  reportGameOver: vi.fn(() => Promise.resolve()),
}));

describe('GamePage Component', () => {
  test('renders settings page initially', () => {
    render(
      <MemoryRouter>
        <GamePage />
      </MemoryRouter>
    );
    expect(screen.getByText(/NOMBRE DE MANCHES/i)).toBeInTheDocument();
  });

  test('updates number of rounds when slider changes', () => {
    render(
      <MemoryRouter>
        <GamePage />
      </MemoryRouter>
    );
    const slider = screen.getByRole('slider');
    fireEvent.change(slider, { target: { value: '20' } });
    expect(screen.getByText('20')).toBeInTheDocument();
  });

  test('starts the game when clicking lancer la partie', async () => {
    render(
      <MemoryRouter>
        <GamePage />
      </MemoryRouter>
    );

    const startButton = screen.getByText(/LANCER LA PARTIE/i);
    fireEvent.click(startButton);

    // Wait for the transition to playing view
    const badge = await screen.findByText(/MANCHE 1/i);
    expect(badge).toBeInTheDocument();
    expect(screen.getByText(/Mock Job/i)).toBeInTheDocument();
  });
});
