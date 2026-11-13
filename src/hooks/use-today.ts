"use client";

import { useEffect, useState } from "react";
import type { Today } from "@/lib/battle/fair-play";
import { postJson } from "@/lib/battle/client";

export function useToday() {
  const [today, setToday] = useState<Today | null>(null);

  useEffect(() => {
    let live = true;
    postJson<Today>("/api/battle/today", {})
      .then((reply) => {
        if (live && reply.ok) setToday(reply.data);
      })
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, []);

  return [today, setToday] as const;
}
