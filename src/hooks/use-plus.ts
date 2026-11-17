"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/hooks/use-session";
import { postJson } from "@/lib/battle/client";
import type { PlusState } from "@/lib/data/plus";

const cache = new Map<string, Promise<boolean>>();

/** One lookup per signed-in account and page load, shared by every part of the nav */
function load(uid: string): Promise<boolean> {
  let hit = cache.get(uid);
  if (!hit) {
    hit = postJson<PlusState>("/api/plus", { op: "state" }).then(
      (reply) => reply.ok && reply.data.plus,
    );
    cache.set(uid, hit);
  }
  return hit;
}

export function usePlus(): boolean {
  const { state } = useSession();
  const uid = state.status === "ready" ? (state.user?.uid ?? null) : null;
  const [plus, setPlus] = useState(false);

  useEffect(() => {
    if (!uid) return;
    let live = true;
    void load(uid).then((value) => {
      if (live) setPlus(value);
    });
    return () => {
      live = false;
    };
  }, [uid]);

  return uid ? plus : false;
}
