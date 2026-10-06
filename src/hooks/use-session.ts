"use client";

import { useCallback, useEffect, useState } from "react";

export type SessionUser = { uid: string; verified: boolean };
type State = { status: "loading" } | { status: "ready"; user: SessionUser | null };

async function load(): Promise<State> {
  try {
    const response = await fetch("/api/auth/me", { cache: "no-store" });
    const user = response.ok ? ((await response.json()) as SessionUser | null) : null;
    return { status: "ready", user };
  } catch {
    return { status: "ready", user: null };
  }
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
    setState(await load());
  }, []);

  return { state, refresh };
}