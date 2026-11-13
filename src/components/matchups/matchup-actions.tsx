"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { randomPair } from "@/lib/matchup/random-pair";
import type { MatchupPreset } from "@/lib/matchup/preset";
import { OPEN_MATCHUP } from "@/lib/ui/events";

interface ActionProps {
  className?: string;
  children: React.ReactNode;
}

export function NewMatchupButton({
  preset,
  className,
  children,
}: ActionProps & { preset?: MatchupPreset }) {
  return (
    <button
      type="button"
      className={className}
      onClick={() =>
        window.dispatchEvent(
          new CustomEvent(OPEN_MATCHUP, { detail: { preset: preset ?? null } }),
        )
      }
    >
      {children}
    </button>
  );
}

export function SurpriseButton({ className, children }: ActionProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function surprise() {
    setBusy(true);
    const pair = await randomPair();
    setBusy(false);
    if (pair) router.push(`/matchups/${pair[0]}/${pair[1]}`);
  }

  return (
    <button
      type="button"
      className={className}
      disabled={busy}
      onClick={() => void surprise()}
    >
      {children}
    </button>
  );
}
