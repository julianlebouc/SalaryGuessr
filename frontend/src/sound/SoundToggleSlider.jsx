import React, { useRef } from "react";
import { motion } from "framer-motion";
import { useSound } from "./SoundProvider";
import "./SoundToggleSlider.css";

/**
 * @module Sound/SoundToggleSlider
 */

/**
 * Polished Volume control slider with mute toggle.
 * @component
 */
export default function SoundToggleSlider() {
  const { volume, setVolume } = useSound();
  const volumeBeforeMuteRef = useRef(volume > 0 ? volume : 0.5);

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
      <motion.button
        whileTap={{ scale: 0.9 }}
        type="button"
        className="sg-sound-icon-btn"
        onClick={toggleMute}
        title={volume <= 0 ? "Réactiver le son" : "Couper le son"}
      >
        <span>
          {volume <= 0 ? "🔇" : volume < 0.5 ? "🔉" : "🔊"}
        </span>
      </motion.button>
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
      />
    </div>
  );
}
