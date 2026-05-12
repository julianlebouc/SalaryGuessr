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
    
    expect(screen.getByRole('heading', { name: /Salary/i })).toBeInTheDocument();
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
});
