"use client";

import { useCallback, useState } from "react";
import { OPEN_SIGN_IN } from "@/lib/auth/events";
import { postJson } from "@/lib/battle/client";

export function useBattleApi() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const request = useCallback(async <T>(url: string, body: unknown): Promise<T | null> => {
    setBusy(true);
    const reply = await postJson<T>(url, body);
    setBusy(false);
    if (reply.ok) {
      setError(null);
      return reply.data;
    }
    if (reply.status === 401) window.dispatchEvent(new Event(OPEN_SIGN_IN));
    setError(reply.status === 401 ? "Sign in to play." : reply.error);
    return null;
  }, []);

  return { busy, error, request };
}