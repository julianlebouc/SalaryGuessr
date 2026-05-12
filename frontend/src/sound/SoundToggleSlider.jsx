import React, { useRef } from "react";
import { motion } from "framer-motion";
import { useSound } from "./SoundProvider";
import "./SoundToggleSlider.css";

/**
 * @module Sound/SoundToggleSlider
 */

/**
 * Polished Volume control slider with mute toggle.
 * 
 * @component
 * @returns {JSX.Element}
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
        <span style={{ display: 'flex', alignItems: 'center' }}>
          {volume <= 0 ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 5L6 9H2v6h4l5 4V5z"></path><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 5L6 9H2v6h4l5 4V5z"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
          )}
        </span>
      </motion.button>
      <input
        className="sg-sound-slider"
        type="range"
        min="0"
        max="100"
        step="1"
        aria-label="Volume"
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
