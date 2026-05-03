import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ModeSelectPage from '../pages/ModeSelectPage';
import { vi } from 'vitest';

// Mocks
const mockNavigate = vi.fn();
const mockPlay = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../sound/SoundProvider', () => ({
  useSound: () => ({ play: mockPlay }),
}));

describe('ModeSelectPage Component', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockPlay.mockClear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('renders all game modes', () => {
    render(
      <MemoryRouter>
        <ModeSelectPage />
      </MemoryRouter>
    );
    
    expect(screen.getByText(/CLASSIQUE/i)).toBeInTheDocument();
    expect(screen.getByText(/HIGH \/ LOW/i)).toBeInTheDocument();
    expect(screen.getByText(/BATTLE ROYALE/i)).toBeInTheDocument();
  });

  test('navigates to classic mode when clicked', () => {
    render(
      <MemoryRouter>
        <ModeSelectPage />
      </MemoryRouter>
    );
    
    fireEvent.click(screen.getByText(/CLASSIQUE/i));
    expect(mockPlay).toHaveBeenCalledWith('click');
    
    act(() => {
      vi.runAllTimers();
    });
    
    expect(mockNavigate).toHaveBeenCalledWith('/game');
  });

  test('navigates to high/low mode and plays gamestart sound', () => {
    render(
      <MemoryRouter>
        <ModeSelectPage />
      </MemoryRouter>
    );
    
    fireEvent.click(screen.getByText(/HIGH \/ LOW/i));
    expect(mockPlay).toHaveBeenCalledWith('gamestart');
    
    act(() => {
      vi.runAllTimers();
    });
    
    expect(mockNavigate).toHaveBeenCalledWith('/highlow');
  });

  test('navigates back to home when logo clicked', () => {
    render(
      <MemoryRouter>
        <ModeSelectPage />
      </MemoryRouter>
    );
    
    fireEvent.click(screen.getByText(/SalaryGuessr/i));
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });
});
