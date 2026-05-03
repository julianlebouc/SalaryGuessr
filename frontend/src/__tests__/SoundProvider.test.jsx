import { render, screen, fireEvent } from '@testing-library/react';
import { SoundProvider, useSound } from '../sound/SoundProvider';
import { vi, describe, test, expect, beforeEach } from 'vitest';

const SoundConsumer = () => {
  const { volume, setVolume } = useSound();
  return (
    <div>
      <span data-testid="volume">{volume}</span>
      <button onClick={() => setVolume(0.1)}>Set Volume</button>
    </div>
  );
};

describe('SoundProvider', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('manages volume state and persistence', () => {
    render(
      <SoundProvider>
        <SoundConsumer />
      </SoundProvider>
    );
    
    expect(screen.getByTestId('volume').textContent).toBe('0.5');
    
    fireEvent.click(screen.getByText(/Set Volume/i));
    expect(screen.getByTestId('volume').textContent).toBe('0.1');
    expect(localStorage.getItem('salaryguessr_sound_volume')).toBe('0.1');
  });
});
