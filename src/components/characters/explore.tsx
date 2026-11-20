"use client";

import { useEffect, useMemo, useRef } from "react";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { CharacterPage } from "@/lib/data/summary";
import {
  exploreHref,
  facetKey,
  parseExplore,
  stateHref,
  type View,
} from "@/lib/explore/params";
import { cn } from "@/lib/utils";
import { ExploreFilterBar, ExploreToolbar, type ChipKey } from "./explore-controls";
import { ExploreResults } from "./explore-results";

interface ExploreProps {
  hero: React.ReactNode;
  overview: React.ReactNode;
  /** First page of the full ranking, already loaded on the server */
  initial: CharacterPage;
}

function go(href: string, options: { scroll: boolean; replace?: boolean }) {
  if (options.replace) window.history.replaceState(null, "", href);
  else window.history.pushState(null, "", href);
  if (options.scroll) window.scrollTo({ top: 0 });
}

export function Explore({ hero, overview, initial }: ExploreProps) {
  const params = useSearchParams();
  const state = useMemo(() => parseExplore(params), [params]);
  const { mode, facet, view } = state;
  const toOverview = useRef(false);

  useEffect(() => {
    if (mode !== "overview" || !toOverview.current) return;
    toOverview.current = false;
    document.getElementById("overview-start")?.scrollIntoView({ block: "start" });
  }, [mode]);

  const active: ChipKey | null =
    mode === "overview"
      ? "overview"
      : facet.kind === "media"
        ? facet.media
        : facet.kind === "all"
          ? "all"
          : null;

  function select(key: ChipKey) {
    const href =
      key === "overview"
        ? "/"
        : key === "all"
          ? exploreHref({ all: true }, view)
          : exploreHref({ media: key }, view);
    if (key === "overview") toOverview.current = true;
    go(href, { scroll: key !== "overview" });
  }

  function chooseTier(group: number | null) {
    go(
      group === null
        ? exploreHref({ all: true }, view)
        : exploreHref({ tier: group }, view),
      { scroll: true },
    );
  }

  function changeView(next: View) {
    go(stateHref(state, next), { scroll: false, replace: true });
  }

  return (
    <>
      {mode === "overview" ? hero : null}

      <main
        className={cn(
          "mx-auto max-w-6xl px-4 pb-24",
          mode === "overview" ? "pt-6" : "pt-8",
        )}
      >
        {mode === "list" ? (
          <div className="mb-6 flex items-center justify-between border-b pb-3">
            <Link
              href="/"
              scroll={false}
              onClick={(event) => {
                event.preventDefault();
                select("overview");
              }}
              className="eyebrow inline-flex items-center gap-1 hover:underline"
            >
              <ChevronLeft className="size-3.5" aria-hidden />
              Overview
            </Link>
            <span className="eyebrow">Ranking</span>
          </div>
        ) : null}

        <ExploreToolbar
          tier={facet.kind === "tier" ? facet.group : null}
          onTier={chooseTier}
        />
        <ExploreFilterBar
          active={active}
          view={view}
          showView={mode === "list"}
          onSelect={select}
          onView={changeView}
        />

        <div
          id="overview-start"
          className={
            mode === "list" ? "mt-6" : "scroll-mt-[calc(var(--nav-space)+4.5rem)]"
          }
        >
          {mode === "overview" ? (
            overview
          ) : (
            <ExploreResults
              key={facetKey(facet)}
              facet={facet}
              view={view}
              initial={facet.kind === "all" ? initial : null}
            />
          )}
        </div>
      </main>
    </>
  );
}
