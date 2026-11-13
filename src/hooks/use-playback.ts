"use client";

import { useEffect, useState } from "react";

/** Every step plays as three beats: face off, clash, verdict */
export const BEATS = 3;
const BEAT_MS = [2400, 2800, 4200] as const;

export function usePlayback(steps: number) {
  const total = steps * BEATS;
  const [reduced] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [beat, setBeat] = useState(0);
  const [playing, setPlaying] = useState(!reduced);
  const [speed, setSpeed] = useState(1);
  const done = beat >= total;
  const running = playing && !done;

  useEffect(() => {
    if (!running) return;
    const id = setTimeout(
      () => setBeat((b) => Math.min(total, b + 1)),
      BEAT_MS[beat % BEATS]! / speed,
    );
    return () => clearTimeout(id);
  }, [running, beat, total, speed]);

  const step = Math.min(Math.floor(beat / BEATS) + 1, steps);
  const phase = beat % BEATS;

  return {
    step,
    phase,
    done,
    running,
    speed,
    /** Steps whose verdict has been shown */
    resolved: done ? steps : phase === BEATS - 1 ? step : step - 1,
    toggle: () => setPlaying((on) => !on),
    next: () => setBeat((b) => Math.min(total, b + 1)),
    skip: () => setBeat(total),
    cycleSpeed: () => setSpeed((s) => (s === 1 ? 2 : 1)),
    jump: (to: number) => {
      setPlaying(false);
      setBeat((to - 1) * BEATS + BEATS - 1);
    },
    restart: () => {
      setBeat(0);
      setPlaying(!reduced);
    },
  };
}
