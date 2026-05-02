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
          playTone(audioCtx, { frequency: 620, volume: 0.7 * volume, duration: 0.08, type: "triangle" });
          playTone(audioCtx, { frequency: 740, volume: 0.6 * volume, duration: 0.1, type: "triangle", delay: 0.08 });
          break;
        case "gameEnd":
          playTone(audioCtx, { frequency: 523, volume: 0.9 * volume, duration: 0.12, type: "triangle" });
          playTone(audioCtx, { frequency: 659, volume: 0.85 * volume, duration: 0.12, type: "triangle", delay: 0.1 });
          playTone(audioCtx, { frequency: 784, volume: 0.8 * volume, duration: 0.14, type: "triangle", delay: 0.2 });
          break;
        case "success":
          playTone(audioCtx, { frequency: 690, volume: 0.65 * volume, duration: 0.06, type: "sine" });
          playTone(audioCtx, { frequency: 860, volume: 0.65 * volume, duration: 0.07, type: "sine", delay: 0.05 });
          break;
        case "error":
          playTone(audioCtx, { frequency: 260, volume: 0.6 * volume, duration: 0.08, type: "square" });
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
