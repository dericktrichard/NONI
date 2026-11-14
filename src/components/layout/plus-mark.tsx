"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/hooks/use-session";
import { postJson } from "@/lib/battle/client";
import type { PlusState } from "@/lib/data/plus";

/** A small mark beside the wordmark while the signed-in player has NONI Plus */
export function PlusMark() {
  const { state } = useSession();
  const uid = state.status === "ready" ? (state.user?.uid ?? null) : null;
  const [plus, setPlus] = useState(false);

  useEffect(() => {
    if (!uid) return;
    let live = true;
    void postJson<PlusState>("/api/plus", { op: "state" }).then((reply) => {
      if (live) setPlus(reply.ok && reply.data.plus);
    });
    return () => {
      live = false;
    };
  }, [uid]);

  if (!uid || !plus) return null;

  return (
    <span
      title="NONI Plus"
      aria-hidden
      className="bg-accent text-accent-foreground font-display grid size-4 place-items-center text-xs leading-none font-bold"
    >
      +
    </span>
  );
}
