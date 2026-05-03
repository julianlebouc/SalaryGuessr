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
    expect(screen.getByText('20', { selector: '.gp-rangeValue' })).toBeInTheDocument();
  });
});
