import { render, screen, fireEvent } from '@testing-library/react';
import SoundToggleSlider from '../sound/SoundToggleSlider';
import { vi } from 'vitest';
import { useSound } from '../sound/SoundProvider';

vi.mock('../sound/SoundProvider', () => ({
  useSound: vi.fn(),
}));

describe('SoundToggleSlider Component', () => {
  let mockSetVolume;

  beforeEach(() => {
    mockSetVolume = vi.fn();
    useSound.mockReturnValue({
      volume: 0.5,
      setVolume: mockSetVolume,
    });
  });

  test('renders with current volume', () => {
    render(<SoundToggleSlider />);
    const slider = screen.getByLabelText(/Volume/i);
    expect(slider.value).toBe("50");
    expect(screen.getByText("🔊")).toBeInTheDocument();
  });

  test('calls setVolume when slider changes', () => {
    render(<SoundToggleSlider />);
    const slider = screen.getByLabelText(/Volume/i);
    fireEvent.change(slider, { target: { value: "80" } });
    expect(mockSetVolume).toHaveBeenCalledWith(0.8);
  });

  test('toggles mute when button clicked', () => {
    render(<SoundToggleSlider />);
    const muteBtn = screen.getByRole('button');
    fireEvent.click(muteBtn);
    expect(mockSetVolume).toHaveBeenCalledWith(0);
  });

  test('restores volume when unmuting', () => {
    useSound.mockReturnValue({
      volume: 0,
      setVolume: mockSetVolume,
    });
    render(<SoundToggleSlider />);
    const muteBtn = screen.getByRole('button');
    fireEvent.click(muteBtn);
    // It should restore to the ref value (default 0.5 in our mock initial state)
    expect(mockSetVolume).toHaveBeenCalledWith(0.5);
  });
});
