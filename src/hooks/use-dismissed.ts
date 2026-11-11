"use client";

import { useSyncExternalStore } from "react";

const EVENT = "noni:dismissed";
const memory = new Set<string>();
const key = (name: string) => `noni:dismissed:${name}`;

function read(name: string): boolean {
  if (memory.has(name)) return true;
  try {
    return localStorage.getItem(key(name)) === "1";
  } catch {
    return false;
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

export function dismiss(name: string) {
  memory.add(name);
  try {
    localStorage.setItem(key(name), "1");
  } catch {
    /* storage unavailable, the choice lasts for this visit */
  }
  window.dispatchEvent(new Event(EVENT));
}

export const useDismissed = (name: string) =>
  useSyncExternalStore(
    subscribe,
    () => read(name),
    () => true,
  );
