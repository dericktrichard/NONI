"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface ClaimState {
  canClaim: boolean;
  claimAmount: number;
  streak: number;
}

export function DailyClaim() {
  const router = useRouter();
  const [state, setState] = useState<ClaimState | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    fetch("/api/glaze", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data: ClaimState | null) => {
        if (live && data)
          setState({
            canClaim: data.canClaim,
            claimAmount: data.claimAmount,
            streak: data.streak,
          });
      })
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, []);

  async function claim() {
    setBusy(true);
    setNote(null);
    try {
      const response = await fetch("/api/glaze/claim", { method: "POST" });
      const data = (await response.json().catch(() => null)) as {
        amount?: number;
        streak?: number;
        error?: string;
      } | null;
      if (
        response.ok &&
        typeof data?.amount === "number" &&
        typeof data.streak === "number"
      ) {
        setState((current) =>
          current ? { ...current, canClaim: false, streak: data.streak! } : current,
        );
        setNote(`+${data.amount} Glaze`);
        router.refresh();
        return;
      }
      setNote(data?.error ?? "Could not claim right now.");
    } catch {
      setNote("Network error. Try again.");
    } finally {
      setBusy(false);
    }
  }

  if (!state) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t p-3 sm:px-5">
      <div className="min-w-0">
        <p className="eyebrow">Daily Glaze</p>
        <p className="text-muted-foreground mt-1 text-sm">
          {state.canClaim
            ? `Claim ${state.claimAmount} Glaze. Day ${state.streak} of your streak.`
            : `Claimed. Streak day ${state.streak}. Come back tomorrow for more.`}
        </p>
      </div>
      {state.canClaim ? (
        <button
          type="button"
          className="btn btn-solid btn-sm"
          disabled={busy}
          onClick={() => void claim()}
        >
          Claim
        </button>
      ) : null}
      {note ? (
        <p role="status" className="w-full text-sm font-medium">
          {note}
        </p>
      ) : null}
    </div>
  );
}
