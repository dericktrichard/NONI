"use client";

import { useSyncExternalStore } from "react";

const KEY = "noni-banner";

export interface PersonalBanner {
  url: string;
  position: string;
}

interface Snapshot {
  settled: boolean;
  banner: PersonalBanner | null;
}

const SERVER: Snapshot = { settled: false, banner: null };
let snapshot: Snapshot = SERVER;
const listeners = new Set<() => void>();

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

function hinted(): boolean {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

/** Called once we know whether this visitor has a banner of their own */
export function publishBanner(banner: PersonalBanner | null) {
  try {
    if (banner) localStorage.setItem(KEY, "1");
    else localStorage.removeItem(KEY);
  } catch {
    /* private mode: the hint just does not persist */
  }
  snapshot = { settled: true, banner };
  listeners.forEach((listener) => listener());
}

export function useBanner(): Snapshot {
  return useSyncExternalStore(
    subscribe,
    () => snapshot,
    () => SERVER,
  );
}

/** True while this browser last saw a personal banner and the answer has not arrived yet */
export function useBannerPending(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => !snapshot.settled && hinted(),
    () => false,
  );
}
