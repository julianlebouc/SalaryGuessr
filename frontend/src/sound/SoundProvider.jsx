import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

const SoundContext = createContext({
  volume: 0.7,
  setVolume: () => {},
  play: () => {},
});

const SOUND_VOLUME_STORAGE_KEY = "salaryguessr_sound_volume";

function createEnvelopeGain(audioCtx, volume = 1, duration = 0.08) {
  const gainNode = audioCtx.createGain();
  const now = audioCtx.currentTime;
  gainNode.gain.setValueAtTime(0.0001, now);
  gainNode.gain.exponentialRampToValueAtTime(volume, now + 0.01);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  return gainNode;
}

function playTone(audioCtx, { frequency, volume = 1, duration = 0.08, type = "sine", delay = 0 }) {
  const osc = audioCtx.createOscillator();
  const gain = createEnvelopeGain(audioCtx, volume, duration);
  const startAt = audioCtx.currentTime + delay;

  osc.type = type;
  osc.frequency.setValueAtTime(frequency, startAt);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start(startAt);
  osc.stop(startAt + duration + 0.01);
}

export function SoundProvider({ children }) {
  const [volume, setVolumeState] = useState(() => {
    const stored = localStorage.getItem(SOUND_VOLUME_STORAGE_KEY);
    const parsed = stored == null ? NaN : Number(stored);
    if (!Number.isFinite(parsed)) return 0.7;
    return Math.min(1, Math.max(0, parsed));
  });
  const audioCtxRef = useRef(null);

  const ensureAudioContext = useCallback(async () => {
    if (!audioCtxRef.current) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return null;
      audioCtxRef.current = new AudioContextClass();
    }
    if (audioCtxRef.current.state === "suspended") {
      try {
        await audioCtxRef.current.resume();
      } catch (e) {
        return null;
      }
    }
    return audioCtxRef.current;
  }, []);

  const play = useCallback(
    async (kind = "click") => {
      if (volume <= 0) return;
      const audioCtx = await ensureAudioContext();
      if (!audioCtx) return;
  
      switch (kind) {
        case "roundEnd":
          playTone(audioCtx, { frequency: 523.25, volume: 0.9 * volume, duration: 0.08, type: "sine" });
          playTone(audioCtx, { frequency: 659.25, volume: 0.9 * volume, duration: 0.08, type: "sine", delay: 0.08 });
          playTone(audioCtx, { frequency: 783.99, volume: 0.9 * volume, duration: 0.12, type: "sine", delay: 0.16 });
          playTone(audioCtx, { frequency: 1046.50, volume: 1.0 * volume, duration: 0.25, type: "sine", delay: 0.28 });
          playTone(audioCtx, { frequency: 1318.52, volume: 0.95 * volume, duration: 0.3, type: "sine", delay: 0.53 });
          break;
          
        case "gameEnd":
          playTone(audioCtx, { frequency: 523.25, volume: 0.85 * volume, duration: 0.2, type: "sine" });
          playTone(audioCtx, { frequency: 659.25, volume: 0.85 * volume, duration: 0.2, type: "sine", delay: 0.2 });
          playTone(audioCtx, { frequency: 783.99, volume: 0.85 * volume, duration: 0.2, type: "sine", delay: 0.4 });
          playTone(audioCtx, { frequency: 1046.50, volume: 1.0 * volume, duration: 0.35, type: "sine", delay: 0.6 });
          playTone(audioCtx, { frequency: 1318.52, volume: 0.9 * volume, duration: 0.3, type: "sine", delay: 0.95 });
          playTone(audioCtx, { frequency: 1567.98, volume: 0.9 * volume, duration: 0.35, type: "sine", delay: 1.25 });
          playTone(audioCtx, { frequency: 2093.00, volume: 1.0 * volume, duration: 0.5, type: "sine", delay: 1.6 });
          playTone(audioCtx, { frequency: 2637.02, volume: 0.85 * volume, duration: 0.4, type: "sine", delay: 2.1 });
          break;
          
        case "success":
          playTone(audioCtx, { frequency: 1046.50, volume: 0.8 * volume, duration: 0.06, type: "sine" });
          playTone(audioCtx, { frequency: 1318.52, volume: 0.8 * volume, duration: 0.08, type: "sine", delay: 0.06 });
          playTone(audioCtx, { frequency: 1567.98, volume: 0.85 * volume, duration: 0.1, type: "sine", delay: 0.14 });
          playTone(audioCtx, { frequency: 2093.00, volume: 0.9 * volume, duration: 0.15, type: "sine", delay: 0.24 });
          break;
          
        case "error":
          playTone(audioCtx, { frequency: 440.00, volume: 0.7 * volume, duration: 0.12, type: "sawtooth" });
          playTone(audioCtx, { frequency: 349.23, volume: 0.65 * volume, duration: 0.12, type: "sawtooth", delay: 0.12 });
          playTone(audioCtx, { frequency: 261.63, volume: 0.6 * volume, duration: 0.15, type: "sawtooth", delay: 0.24 });
          playTone(audioCtx, { frequency: 196.00, volume: 0.55 * volume, duration: 0.2, type: "sawtooth", delay: 0.39 });
          playTone(audioCtx, { frequency: 130.81, volume: 0.5 * volume, duration: 0.3, type: "sawtooth", delay: 0.59 });
          break;
          
        case "click":
        default:
          playTone(audioCtx, { frequency: 480, volume: 0.45 * volume, duration: 0.04, type: "sine" });
          break;
      }
    },
    [volume, ensureAudioContext]
  );

  const setVolume = useCallback((nextVolume) => {
    const safeVolume = Math.min(1, Math.max(0, nextVolume));
    setVolumeState(safeVolume);
    localStorage.setItem(SOUND_VOLUME_STORAGE_KEY, String(safeVolume));
  }, []);

  useEffect(() => {
    const onGlobalClick = (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const clickable = target.closest("button, a, [role='button'], input[type='button'], input[type='submit']");
      if (!clickable) return;
      play("click");
    };

    document.addEventListener("click", onGlobalClick, true);
    return () => document.removeEventListener("click", onGlobalClick, true);
  }, [play]);

  const value = useMemo(() => ({ volume, setVolume, play }), [volume, setVolume, play]);

  return <SoundContext.Provider value={value}>{children}</SoundContext.Provider>;
}

export function useSound() {
  return useContext(SoundContext);
}
