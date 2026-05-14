import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import HomePage from '../pages/HomePage';
import { vi } from 'vitest';

// Use Vitest's mocking
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('HomePage Component', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  test('renders title and play button', () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );
    
    expect(screen.getByRole('heading', { level: 1, name: /Salary/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Jouer Maintenant/i })).toBeInTheDocument();
  });

  test('navigates to mode select when clicking play button', async () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );
    
    const playButton = screen.getByText(/Jouer Maintenant/i);
    fireEvent.click(playButton);
    
    expect(mockNavigate).toHaveBeenCalledWith('/mode-select');
  });

  test('navigates to discord when clicking discord link', () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );
    
    const discordLink = screen.getByRole('link', { name: /Discord/i });
    expect(discordLink).toHaveAttribute('href', expect.stringContaining('discordapp.com'));
  });

  test('renders stat boxes', () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );
    
    expect(screen.getAllByText(/Offres Réelles/i)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/Gratuit/i)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/Modes de Jeu/i)[0]).toBeInTheDocument();
  });

  test('navigates to stats when clicking stats button', () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );
    
    const statsButton = screen.getByRole('button', { name: /Statistiques/i });
    fireEvent.click(statsButton);
    
    expect(mockNavigate).toHaveBeenCalledWith('/stats');
  });

  test('navigates to mentions legales when clicking the link', () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );
    
    const legalLink = screen.getByText(/Mentions Légales/i);
    fireEvent.click(legalLink);
    
    expect(mockNavigate).toHaveBeenCalledWith('/mentions-legales');
  });

  test('updates CSS variables on mouse move', () => {
    const { container } = render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );
    
    const grid = container.querySelector('.tile-grid');
    
    // Mock getBoundingClientRect
    grid.getBoundingClientRect = vi.fn(() => ({
      left: 0,
      top: 0,
      width: 1000,
      height: 1000,
    }));

    fireEvent.mouseMove(grid, { clientX: 100, clientY: 200 });

    expect(grid.style.getPropertyValue('--mouse-x')).toBe('100px');
    expect(grid.style.getPropertyValue('--mouse-y')).toBe('200px');
  });
});
