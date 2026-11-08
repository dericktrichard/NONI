"use client";

import { useSyncExternalStore } from "react";
import { EMPTY_STATS, parseStats, type PlayStats } from "@/lib/play/stats";

const KEY = "noni:play:v1";
const listeners = new Set<() => void>();
let current: PlayStats | null = null;

function read(): PlayStats {
  if (current === null) {
    let raw: string | null = null;
    try {
      raw = window.localStorage.getItem(KEY);
    } catch {
      raw = null;
    }
    current = parseStats(raw);
  }
  return current;
}

export function savePlayStats(next: PlayStats): void {
  current = next;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Storage can be blocked. The session still works from memory.
  }
  listeners.forEach((listener) => listener());
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export function usePlayStats(): PlayStats {
  return useSyncExternalStore(subscribe, read, () => EMPTY_STATS);
}