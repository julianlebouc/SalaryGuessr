import React, { useRef } from "react";
import { useSound } from "./SoundProvider";

/**
 * @module Sound/SoundToggleSlider
 */

/**
 * Volume control slider with mute toggle button.
 * @component
 * @returns {JSX.Element}
 */
export default function SoundToggleSlider() {
  const { volume, setVolume } = useSound();
  const volumeBeforeMuteRef = useRef(volume > 0 ? volume : 0.5);

/**
   * Toggle mute state while preserving the previous volume level.
   * @memberof module:Sound/SoundToggleSlider
   * @returns {void}
   */
  const toggleMute = () => {
    if (volume <= 0) {
      const restore = volumeBeforeMuteRef.current > 0 ? volumeBeforeMuteRef.current : 0.5;
      setVolume(restore);
    } else {
      volumeBeforeMuteRef.current = volume;
      setVolume(0);
    }
  };

  return (
    <div className="sg-sound-slider-wrap">
      <button
        type="button"
        className="sg-sound-icon-btn"
        onClick={toggleMute}
        aria-label={volume <= 0 ? "Réactiver le son" : "Couper le son"}
        title={volume <= 0 ? "Réactiver le son" : "Couper le son"}
      >
        <span className="sg-sound-icon" aria-hidden="true">
          {volume <= 0 ? "🔇" : volume < 0.5 ? "🔉" : "🔊"}
        </span>
      </button>
      <input
        className="sg-sound-slider"
        type="range"
        min="0"
        max="100"
        step="1"
        value={Math.round(volume * 100)}
        onChange={(e) => {
          const v = Number(e.target.value) / 100;
          if (v > 0) volumeBeforeMuteRef.current = v;
          setVolume(v);
        }}
        aria-label="Volume"
      />
    </div>
  );
}
