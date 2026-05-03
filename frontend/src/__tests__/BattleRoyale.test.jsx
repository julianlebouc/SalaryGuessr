import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import BattleRoyale from '../pages/BattleRoyale';
import { vi, describe, test, expect, beforeEach } from 'vitest';

const mockSocket = {
  on: vi.fn(),
  off: vi.fn(),
  emit: vi.fn(),
  connect: vi.fn(),
  disconnect: vi.fn(),
};

vi.mock('socket.io-client', () => ({
  default: vi.fn(() => mockSocket),
  io: vi.fn(() => mockSocket),
}));

vi.mock('../sound/SoundProvider', () => ({
  useSound: () => ({ play: vi.fn() }),
}));

describe('BattleRoyale Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders basic lobby interface', () => {
    render(
      <MemoryRouter>
        <BattleRoyale />
      </MemoryRouter>
    );
    expect(screen.getByText(/BATTLE ROYALE/i)).toBeInTheDocument();
  });

  test('validates and emits create_room', () => {
    render(
      <MemoryRouter>
        <BattleRoyale />
      </MemoryRouter>
    );
    
    const input = screen.getByPlaceholderText(/pseudo/i);
    fireEvent.change(input, { target: { value: 'Tester' } });
    fireEvent.click(screen.getByText(/CRÉER UNE PARTIE/i));
    
    expect(mockSocket.emit).toHaveBeenCalledWith('create_room', expect.any(Object));
  });
});
