"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { OPEN_SIGN_IN } from "@/lib/auth/events";
import type { ArgumentView } from "@/lib/data/matchup-page";
import { cn } from "@/lib/utils";

interface ArgumentListProps {
  items: ArgumentView[];
  names: { a: string; b: string };
  slugs: { a: string; b: string };
}

type Tally = { upvotes: number; downvotes: number };
type Mine = Record<string, 1 | -1>;

const voteButton =
  "grid size-11 place-items-center border border-transparent transition-colors hover:bg-muted disabled:opacity-40";

export function ArgumentList({ items, names, slugs }: ArgumentListProps) {
  const [overrides, setOverrides] = useState<Record<string, Tally>>({});
  const [mine, setMine] = useState<Mine>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const ids = items.map((item) => item.id).join(",");

  useEffect(() => {
    if (!ids) return;
    let active = true;
    fetch(`/api/matchups/arguments/mine?a=${slugs.a}&b=${slugs.b}&ids=${ids}`, { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { votes?: Mine } | null) => {
        if (active && data?.votes) setMine(data.votes);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [ids, slugs.a, slugs.b]);

  async function vote(id: string, value: 1 | -1) {
    const next = (mine[id] ?? 0) === value ? 0 : value;
    setBusyId(id);
    setMessage(null);
    try {
      const response = await fetch("/api/matchups/arguments/vote", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ a: slugs.a, b: slugs.b, argumentId: id, value: next }),
      });
      if (response.status === 401) {
        window.dispatchEvent(new Event(OPEN_SIGN_IN));
        setMessage("Sign in to vote.");
        return;
      }
      const data = (await response.json().catch(() => null)) as
        | { upvotes?: number; downvotes?: number; value?: number; error?: string }
        | null;
      if (response.ok && typeof data?.upvotes === "number" && typeof data.downvotes === "number") {
        const tally: Tally = { upvotes: data.upvotes, downvotes: data.downvotes };
        const stored = data.value;
        setOverrides((current) => ({ ...current, [id]: tally }));
        setMine((current) => {
          const copy = { ...current };
          if (stored === 1 || stored === -1) copy[id] = stored;
          else delete copy[id];
          return copy;
        });
        return;
      }
      setMessage(data?.error ?? "Could not record your vote.");
    } catch {
      setMessage("Network error. Try again.");
    } finally {
      setBusyId(null);
    }
  }

  if (items.length === 0) {
    return <p className="mt-4 text-sm text-muted-foreground">No arguments yet. Be the first to make a case.</p>;
  }

  return (
    <div>
      <ul className="mt-2 divide-y border-y">
        {items.map((item) => {
          const tally = overrides[item.id] ?? { upvotes: item.upvotes, downvotes: item.downvotes };
          const picked = mine[item.id] ?? 0;

          return (
            <li key={item.id} className="flex gap-4 py-5">
              <div className="flex w-11 shrink-0 flex-col items-center">
                <button
                  type="button"
                  aria-label="Upvote"
                  aria-pressed={picked === 1}
                  disabled={busyId === item.id}
                  onClick={() => void vote(item.id, 1)}
                  className={cn(voteButton, picked === 1 && "bg-accent text-accent-foreground")}
                >
                  <ChevronUp className="size-5" aria-hidden />
                </button>
                <span className="tabular py-1 text-sm font-semibold">{tally.upvotes - tally.downvotes}</span>
                <button
                  type="button"
                  aria-label="Downvote"
                  aria-pressed={picked === -1}
                  disabled={busyId === item.id}
                  onClick={() => void vote(item.id, -1)}
                  className={cn(voteButton, picked === -1 && "bg-foreground text-background")}
                >
                  <ChevronDown className="size-5" aria-hidden />
                </button>
              </div>

              <div className="min-w-0 flex-1">
                <p className="eyebrow">
                  Argues for {names[item.side]} / {item.authorName} / {item.createdAt.slice(0, 10)}
                </p>
                <p className="mt-2 text-sm whitespace-pre-line">{item.body}</p>
                <ul className="mt-3 space-y-1">
                  {item.citations.map((citation) => (
                    <li key={`${citation.characterId}/${citation.featId}`} className="text-sm">
                      <span className="eyebrow mr-2">Cites</span>
                      <Link href={`/characters/${citation.characterId}`} className="underline underline-offset-4">
                        {citation.title || citation.featId}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </li>
          );
        })}
      </ul>

      {message ? (
        <p role="status" className="mt-3 text-sm">
          {message}
        </p>
      ) : null}
    </div>
  );
}