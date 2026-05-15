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

vi.mock('../context/SettingsContext', () => ({
  useSettings: () => ({
    volume: 0.5,
    setVolume: vi.fn(),
    salaryType: 'brut',
    salaryPeriod: 'monthly',
    convertToBase: (val) => val,
    convertFromBase: (val) => val,
    getSalaryLabel: () => 'Brut Mensuel',
  }),
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
    fireEvent.click(screen.getByText(/Ouvrir l'Arène/i));
    
    expect(mockSocket.emit).toHaveBeenCalledWith('create_room', expect.objectContaining({ name: 'Tester' }));
  });

  test('switches to join tab and emits join_room', () => {
    render(
      <MemoryRouter>
        <BattleRoyale />
      </MemoryRouter>
    );
    
    const joinTab = screen.getByText(/REJOINDRE/i);
    fireEvent.click(joinTab);
    
    const pseudoInput = screen.getByPlaceholderText(/pseudo/i);
    const codeInput = screen.getByPlaceholderText(/code salle/i);
    
    fireEvent.change(pseudoInput, { target: { value: 'Joiner' } });
    fireEvent.change(codeInput, { target: { value: 'ABCDEF' } });
    
    fireEvent.click(screen.getByText(/Entrer dans l'Arène/i));
    
    expect(mockSocket.emit).toHaveBeenCalledWith('join_room', expect.objectContaining({ 
      name: 'Joiner',
      code: 'ABCDEF'
    }));
  });
});
