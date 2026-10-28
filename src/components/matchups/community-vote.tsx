"use client";

import { useEffect, useState } from "react";
import { OPEN_SIGN_IN } from "@/lib/auth/events";
import { sharePercent, type RequestedPick, type ViewTally } from "@/lib/matchup/vote";
import { cn } from "@/lib/utils";

interface Side {
  slug: string;
  name: string;
}

interface CommunityVoteProps {
  a: Side;
  b: Side;
  initial: ViewTally;
}

export function CommunityVote({ a, b, initial }: CommunityVoteProps) {
  const [tally, setTally] = useState<ViewTally>(initial);
  const [pick, setPick] = useState<RequestedPick>("none");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch(`/api/matchups/mine?a=${a.slug}&b=${b.slug}`, { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { pick?: RequestedPick } | null) => {
        if (active && data?.pick) setPick(data.pick);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [a.slug, b.slug]);

  async function vote(side: "a" | "b") {
    const next: RequestedPick = pick === side ? "none" : side;
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch("/api/matchups/vote", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ a: a.slug, b: b.slug, pick: next }),
      });
      if (response.status === 401) {
        window.dispatchEvent(new Event(OPEN_SIGN_IN));
        setMessage("Sign in to vote.");
        return;
      }
      const data = (await response.json().catch(() => null)) as
        | { a?: number; b?: number; pick?: RequestedPick; error?: string }
        | null;
      if (response.ok && typeof data?.a === "number" && typeof data.b === "number") {
        setTally({ a: data.a, b: data.b });
        setPick(data.pick ?? "none");
        return;
      }
      setMessage(data?.error ?? "Could not record your vote.");
    } catch {
      setMessage("Network error. Try again.");
    } finally {
      setBusy(false);
    }
  }

  const total = tally.a + tally.b;
  const sides = [
    { key: "a" as const, side: a, count: tally.a, pressed: "bg-foreground text-background hover:bg-foreground" },
    { key: "b" as const, side: b, count: tally.b, pressed: "bg-accent text-accent-foreground hover:bg-accent" },
  ];

  return (
    <div>
      <div className="grid grid-cols-2 gap-3">
        {sides.map(({ key, side, count, pressed }) => (
          <button
            key={key}
            type="button"
            aria-pressed={pick === key}
            disabled={busy}
            onClick={() => void vote(key)}
            className={cn(
              "min-h-20 border p-3 text-left transition-colors hover:bg-muted disabled:opacity-40",
              pick === key && pressed,
            )}
          >
            <span className="block truncate text-sm font-medium">{side.name}</span>
            <span className="font-display tabular block text-3xl font-semibold">{sharePercent(count, total)}%</span>
            <span className="eyebrow block">{count} {count === 1 ? "vote" : "votes"}</span>
          </button>
        ))}
      </div>

      <p className="eyebrow mt-3">{total === 0 ? "No votes yet" : `${total} ${total === 1 ? "vote" : "votes"} in total`}</p>

      {message ? (
        <p role="status" className="mt-2 text-sm">
          {message}
        </p>
      ) : null}
    </div>
  );
}