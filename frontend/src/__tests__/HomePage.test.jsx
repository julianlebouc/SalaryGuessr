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
    
    expect(screen.getByText(/Salary Guessr/i)).toBeInTheDocument();
    expect(screen.getByText(/🚀 JOUER/i)).toBeInTheDocument();
  });

  test('navigates to mode select when clicking play button', async () => {
    vi.useFakeTimers();
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );
    
    const playButton = screen.getByText(/🚀 JOUER/i);
    fireEvent.click(playButton);
    
    // Check loading state
    expect(screen.getByText(/⏳ CHARGEMENT/i)).toBeInTheDocument();
    
    // Fast-forward timers
    act(() => {
      vi.runAllTimers();
    });
    
    expect(mockNavigate).toHaveBeenCalledWith('/mode-select');
    vi.useRealTimers();
  });

  test('copies discord id when clicking discord button', async () => {
    // Mock clipboard API
    const mockClipboard = {
      writeText: vi.fn().mockResolvedValue(undefined),
    };
    vi.stubGlobal('navigator', { clipboard: mockClipboard });
    // Mock window.open
    const mockOpen = vi.fn();
    vi.stubGlobal('window', { open: mockOpen, document: window.document });
    
    render(<HomePage />);
    
    const discordBtn = screen.getByRole('button', { name: /Discord/i });
    fireEvent.click(discordBtn);
    
    expect(mockClipboard.writeText).toHaveBeenCalledWith('321002968218337289');
    expect(mockOpen).toHaveBeenCalled();
  });

  test('handles stats hover', () => {
    render(<HomePage />);
    
    const statCard = screen.getByText(/Modes de jeu/i).closest('.hp-statCard');
    fireEvent.mouseEnter(statCard);
    expect(statCard).toHaveClass('hovered');
    
    fireEvent.mouseLeave(statCard);
    expect(statCard).not.toHaveClass('hovered');
  });
});
