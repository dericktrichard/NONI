"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";

export type SessionUser = {
  uid: string;
  verified: boolean;
  role: "user" | "moderator" | "admin";
  handle: string | null;
  avatarUrl: string | null;
  avatarName: string | null;
};
export type SessionState =
  { status: "loading" } | { status: "ready"; user: SessionUser | null };

const LOADING: SessionState = { status: "loading" };

let current: SessionState = LOADING;
let started = false;
const listeners = new Set<() => void>();

function publish(next: SessionState) {
  current = next;
  listeners.forEach((listener) => listener());
}

async function request(): Promise<SessionState> {
  try {
    const response = await fetch("/api/auth/me", { cache: "no-store" });
    const user = response.ok ? ((await response.json()) as SessionUser | null) : null;
    return { status: "ready", user };
  } catch {
    return { status: "ready", user: null };
  }
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
const getSnapshot = () => current;
const getServerSnapshot = () => LOADING;

export function useSession() {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    if (started) return;
    started = true;
    void request().then(publish);
  }, []);

  const refresh = useCallback(async () => {
    publish(await request());
  }, []);

  return { state, refresh };
}
