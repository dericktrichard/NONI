"use client";

import { useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MEDIA_LABELS } from "@/config/media";
import { TIER_GROUPS } from "@/config/scales";
import { facetQueryString, type Facet } from "@/lib/data/query";
import type { CharacterPage } from "@/lib/data/summary";
import type { MediaType } from "@/types/character";
import { Podium } from "./podium";
import { RankingCard } from "./ranking-card";
import { RankingFilterBar, RankingToolbar, type View } from "./ranking-controls";
import { RankingRow } from "./ranking-row";
import { RankingSkeleton } from "./ranking-skeleton";

type Status = "idle" | "loading" | "more" | "error";

const GENERIC_ERROR = "Could not load the rankings. Check your connection and try again.";
const SEARCH_DELAY_MS = 250;
const SEARCH_MIN_LENGTH = 2;

function facetLabel(facet: Facet): string {
  switch (facet.kind) {
    case "all":
      return "All characters";
    case "media":
      return MEDIA_LABELS[facet.media];
    case "tier":
      return `Tier ${facet.group}: ${TIER_GROUPS[facet.group] ?? "Unknown"}`;
    case "verse":
      return `Verse: ${facet.verseId}`;
    case "search":
      return `Results for "${facet.term}"`;
  }
}

export function RankingBoard({ initial }: { initial: CharacterPage }) {
  const [facet, setFacet] = useState<Facet>({ kind: "all" });
  const [searchText, setSearchText] = useState("");
  const [view, setView] = useState<View>("rows");
  const [page, setPage] = useState<CharacterPage>(initial);
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState(GENERIC_ERROR);

  // Only the newest request may update the screen, so slow replies never overwrite fresh ones
  const latest = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  async function load(target: Facet, after: number | null) {
    const append = after !== null;
    const id = ++latest.current;
    const fail = (text: string) => {
      if (id !== latest.current) return;
      if (!append) setPage({ items: [], next: null });
      setMessage(text);
      setStatus("error");
    };

    setStatus(append ? "more" : "loading");

    try {
      const response = await fetch(`/api/characters?${facetQueryString(target, after)}`);
      if (id !== latest.current) return;

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        fail(response.status === 400 && body?.error ? body.error : GENERIC_ERROR);
        return;
      }

      const data = (await response.json()) as CharacterPage;
      if (id !== latest.current) return;

      setPage((previous) =>
        append ? { items: [...previous.items, ...data.items], next: data.next } : data,
      );
      setStatus("idle");
    } catch {
      fail(GENERIC_ERROR);
    }
  }

  function apply(next: Facet) {
    clearTimeout(timer.current);
    setFacet(next);
    void load(next, null);
  }

  function chooseMedia(media: MediaType | null) {
    setSearchText("");
    apply(media === null ? { kind: "all" } : { kind: "media", media });
  }

  function chooseTier(group: number | null) {
    setSearchText("");
    apply(group === null ? { kind: "all" } : { kind: "tier", group });
  }

  function changeSearch(text: string) {
    setSearchText(text);
    clearTimeout(timer.current);

    const term = text.trim();
    if (term.length === 0) {
      apply({ kind: "all" });
    } else if (term.length >= SEARCH_MIN_LENGTH) {
      timer.current = setTimeout(() => apply({ kind: "search", term }), SEARCH_DELAY_MS);
    }
  }

  const { items, next } = page;
  const showPodium = facet.kind !== "search" && items.length >= 3;
  const top = showPodium ? items.slice(0, 3) : [];
  const rest = showPodium ? items.slice(3) : items;
  const offset = top.length;

  const hasItems = items.length > 0;
  const loading = status === "loading";

  return (
    <section aria-label="Character ranking">
      <RankingToolbar
        searchText={searchText}
        tier={facet.kind === "tier" ? facet.group : null}
        onSearchText={changeSearch}
        onTier={chooseTier}
      />
      <RankingFilterBar
        media={facet.kind === "media" ? facet.media : null}
        view={view}
        onMedia={chooseMedia}
        onView={setView}
      />

      <div className="mt-6" aria-busy={loading}>
        {loading ? (
          <RankingSkeleton />
        ) : !hasItems && status === "error" ? (
          <div className="border p-6">
            <p className="font-display text-lg font-semibold">Something went wrong</p>
            <p className="mt-1 text-sm text-muted-foreground">{message}</p>
            <Button className="mt-4" variant="outline" onClick={() => void load(facet, null)}>
              Try again
            </Button>
          </div>
        ) : !hasItems ? (
          <div className="border p-6">
            <p className="font-display text-lg font-semibold">No characters found</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {facet.kind === "all"
                ? "The ranking is empty. If this is a new project, run the seed script."
                : "Nothing matches this filter. Try a different one."}
            </p>
            {facet.kind !== "all" && (
              <Button
                className="mt-4"
                variant="outline"
                onClick={() => {
                  setSearchText("");
                  apply({ kind: "all" });
                }}
              >
                Clear filter
              </Button>
            )}
          </div>
        ) : (
          <>
            <p className="eyebrow mb-3">
              {facetLabel(facet)} / showing {items.length}
              {next !== null ? "+" : ""}
            </p>

            {showPodium && <Podium items={top} />}

            {rest.length > 0 && (
              <>
                {showPodium && <p className="eyebrow mt-8 mb-3">Ranks 04 onward</p>}

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
            )}

            {status === "error" ? (
              <div className="mt-6 border p-4">
                <p className="text-sm text-muted-foreground">{message}</p>
                <Button className="mt-3" variant="outline" onClick={() => void load(facet, next)}>
                  Try again
                </Button>
              </div>
            ) : (
              next !== null && (
                <div className="mt-6 flex justify-center">
                  <Button
                    variant="outline"
                    size="lg"
                    disabled={status === "more"}
                    onClick={() => void load(facet, next)}
                  >
                    {status === "more" ? (
                      <>
                        <Loader2 className="size-4 animate-spin" aria-hidden />
                        Loading
                      </>
                    ) : (
                      "Load more"
                    )}
                  </Button>
                </div>
              )
            )}
          </>
        )}
      </div>

      <p className="sr-only" role="status">
        {loading ? "Loading rankings" : `${items.length} characters shown`}
      </p>
    </section>
  );
}
