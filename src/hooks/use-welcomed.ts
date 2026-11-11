"use client";

import { useSyncExternalStore } from "react";

const EVENT = "noni:welcomed";
const key = (uid: string) => `noni:welcomed:${uid}`;

function read(uid: string): boolean {
  try {
    return localStorage.getItem(key(uid)) === "1";
  } catch {
    return true;
  }
}

const subscribe = (callback: () => void) => {
  window.addEventListener(EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(EVENT, callback);
    window.removeEventListener("storage", callback);
  };
};

export function markWelcomed(uid: string) {
  try {
    localStorage.setItem(key(uid), "1");
  } catch {
    /* storage unavailable, the flow is treated as done */
  }
  window.dispatchEvent(new Event(EVENT));
}

export const useWelcomed = (uid: string | null) =>
  useSyncExternalStore(
    subscribe,
    () => (uid ? read(uid) : true),
    () => true,
  );
