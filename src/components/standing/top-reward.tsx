"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { postJson } from "@/lib/battle/client";

interface Preview {
  positions: string[];
  amount: number;
  claimed: boolean;
}

export function TopReward({ boards }: { boards: boolean }) {
  const router = useRouter();
  const [state, setState] = useState<Preview | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    if (!boards) return;
    let live = true;
    postJson<Preview>("/api/glaze/top", { preview: true })
      .then((reply) => {
        if (live && reply.ok) setState(reply.data);
      })
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, [boards]);

  async function claim() {
    setBusy(true);
    setNote(null);
    const reply = await postJson<{ amount: number }>("/api/glaze/top", {
      preview: false,
    });
    if (reply.ok) {
      setState((current) => (current ? { ...current, claimed: true } : current));
      setNote(`+${reply.data.amount} Glaze`);
      router.refresh();
    } else {
      setNote(reply.error);
    }
    setBusy(false);
  }

  if (!boards || !state) return null;

  const holding = state.positions.length > 0;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t p-3 sm:px-5">
      <div className="min-w-0">
        <p className="eyebrow">Top position reward</p>
        <p className="text-muted-foreground mt-1 text-sm">
          {state.claimed
            ? "Claimed today. Come back tomorrow."
            : holding
              ? `Claim ${state.amount} Glaze for holding: ${state.positions.join(", ")}.`
              : "Hold No. 1 on a board, or as the top fan of a character, to earn a daily reward."}
        </p>
      </div>
      {holding && !state.claimed ? (
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
