"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useSession } from "@/hooks/use-session";
import type { Standing } from "@/lib/standing/types";

const REFRESH_MS = 60_000;

/** Your Glaze rank beside the Leaderboard link, once you are on the boards. Refreshed after navigation, at most once a minute. */
export function RankChip() {
  const { state } = useSession();
  const signedIn = state.status === "ready" && state.user !== null;
  const pathname = usePathname();
  const [rank, setRank] = useState<number | null>(null);
  const last = useRef(0);

  useEffect(() => {
    if (!signedIn || Date.now() - last.current < REFRESH_MS) return;
    last.current = Date.now();
    fetch("/api/standing/me", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data: Standing | null) => setRank(data?.boards ? data.glaze.rank : null))
      .catch(() => undefined);
  }, [signedIn, pathname]);

  if (!signedIn || rank === null) return null;

  return (
    <Link
      href="/leaderboard"
      aria-label={`Your rank is ${rank}`}
      className="eyebrow tabular hover:border-foreground ml-1 border px-1.5 py-0.5 transition-colors"
    >
      #{rank}
    </Link>
  );
}
