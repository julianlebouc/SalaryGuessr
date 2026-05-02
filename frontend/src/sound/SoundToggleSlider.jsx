import React from "react";
import { useSound } from "./SoundProvider";

export default function SoundToggleSlider() {
  const { volume, setVolume } = useSound();

  return (
    <div className="sg-sound-slider-wrap" aria-label="Contrôle du volume des sons">
      <span className="sg-sound-icon" aria-hidden="true">
        {volume <= 0 ? "🔇" : volume < 0.5 ? "🔉" : "🔊"}
      </span>
      <input
        className="sg-sound-slider"
        type="range"
        min="0"
        max="100"
        step="1"
        value={Math.round(volume * 100)}
        onChange={(e) => setVolume(Number(e.target.value) / 100)}
        aria-label="Volume"
      />
    </div>
  );
}
