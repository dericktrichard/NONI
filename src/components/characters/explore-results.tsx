"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { facetQueryString, type Facet } from "@/lib/data/query";
import type { CharacterPage } from "@/lib/data/summary";
import type { View } from "@/lib/explore/params";
import { Podium } from "./podium";
import { RankingCard } from "./ranking-card";
import { RankingRow } from "./ranking-row";
import { RankingSkeleton } from "./ranking-skeleton";

type Status = "idle" | "loading" | "more" | "error";
type FetchResult = { ok: true; page: CharacterPage } | { ok: false; message: string };

const GENERIC_ERROR = "Could not load the rankings. Check your connection and try again.";

async function fetchPage(facet: Facet, after: number | null): Promise<FetchResult> {
  try {
    const response = await fetch(`/api/characters?${facetQueryString(facet, after)}`);
    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      return {
        ok: false,
        message: response.status === 400 && body?.error ? body.error : GENERIC_ERROR,
      };
    }
    return { ok: true, page: (await response.json()) as CharacterPage };
  } catch {
    return { ok: false, message: GENERIC_ERROR };
  }
}

interface ExploreResultsProps {
  facet: Facet;
  view: View;
  /** Server-rendered first page, when we already have it. Otherwise the list loads on mount. */
  initial: CharacterPage | null;
}

/** Mount with a `key` per facet, so each filter starts from a clean state */
export function ExploreResults({ facet, view, initial }: ExploreResultsProps) {
  const [page, setPage] = useState<CharacterPage>(initial ?? { items: [], next: null });
  const [status, setStatus] = useState<Status>(initial ? "idle" : "loading");
  const [message, setMessage] = useState(GENERIC_ERROR);
  const latest = useRef(0);

  useEffect(() => {
    if (initial !== null) return;
    let live = true;
    void fetchPage(facet, null).then((result) => {
      if (!live) return;
      if (result.ok) {
        setPage(result.page);
        setStatus("idle");
      } else {
        setMessage(result.message);
        setStatus("error");
      }
    });
    return () => {
      live = false;
    };
  }, [facet, initial]);

  async function run(after: number | null) {
    const append = after !== null;
    const id = ++latest.current;
    setStatus(append ? "more" : "loading");

    const result = await fetchPage(facet, after);
    if (id !== latest.current) return;

    if (result.ok) {
      setPage((previous) =>
        append
          ? { items: [...previous.items, ...result.page.items], next: result.page.next }
          : result.page,
      );
      setStatus("idle");
      return;
    }
    if (!append) setPage({ items: [], next: null });
    setMessage(result.message);
    setStatus("error");
  }

  const { items, next } = page;
  const showPodium = items.length >= 3;
  const top = showPodium ? items.slice(0, 3) : [];
  const rest = showPodium ? items.slice(3) : items;
  const offset = top.length;
  const loading = status === "loading";

  if (loading) {
    return (
      <div aria-busy>
        <RankingSkeleton />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="border p-6">
        <p className="font-display text-lg font-semibold">
          {status === "error" ? "Something went wrong" : "No characters found"}
        </p>
        <p className="text-muted-foreground mt-1 text-sm">
          {status === "error"
            ? message
            : "Nothing matches this filter yet. Try a different one."}
        </p>
        {status === "error" ? (
          <button
            type="button"
            className="btn btn-line mt-4"
            onClick={() => void run(null)}
          >
            Try again
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div>
      <p className="eyebrow mb-3">
        Showing {items.length}
        {next !== null ? "+" : ""}
      </p>

      {showPodium ? <Podium items={top} /> : null}

      {rest.length > 0 ? (
        <>
          {showPodium ? (
            <p className="eyebrow mt-10 mb-3 flex items-center gap-3">
              Ranks 04 onward
              <span className="bg-border h-px flex-1" aria-hidden />
            </p>
          ) : null}

          {view === "rows" ? (
            <ul className="border-t">
              {rest.map((c, i) => (
                <RankingRow key={c.id} c={c} position={offset + i + 1} />
              ))}
            </ul>
          ) : (
            <ul className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 lg:grid-cols-4">
              {rest.map((c, i) => (
                <RankingCard key={c.id} c={c} position={offset + i + 1} />
              ))}
            </ul>
          )}
        </>
      ) : null}

      {status === "error" ? (
        <div className="mt-6 border p-4">
          <p className="text-muted-foreground text-sm">{message}</p>
          <button
            type="button"
            className="btn btn-line mt-3"
            onClick={() => void run(next)}
          >
            Try again
          </button>
        </div>
      ) : next !== null ? (
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            className="btn btn-line"
            disabled={status === "more"}
            onClick={() => void run(next)}
          >
            {status === "more" ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Loading
              </>
            ) : (
              "Load more"
            )}
          </button>
        </div>
      ) : null}

      <p className="sr-only" role="status">
        {items.length} characters shown
      </p>
    </div>
  );
}
