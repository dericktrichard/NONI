"use client";

import { useCallback, useEffect, useState } from "react";

export type SessionUser = { uid: string; verified: boolean; role: "user" | "moderator" | "admin" };
type State = { status: "loading" } | { status: "ready"; user: SessionUser | null };

async function request(): Promise<State> {
  try {
    const response = await fetch("/api/auth/me", { cache: "no-store" });
    const user = response.ok ? ((await response.json()) as SessionUser | null) : null;
    return { status: "ready", user };
  } catch {
    return { status: "ready", user: null };
  }
}

let inflight: Promise<State> | null = null;

function load(): Promise<State> {
  inflight ??= request().finally(() => {
    inflight = null;
  });
  return inflight;
}

export function useSession() {
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    let active = true;
    void load().then((next) => {
      if (active) setState(next);
    });
    return () => {
      active = false;
    };
  }, []);

  const refresh = useCallback(async () => {
    setState(await request());
  }, []);

  return { state, refresh };
}