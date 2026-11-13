"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { SectionHeading } from "@/components/home/section-heading";
import { MEDIA_LABELS } from "@/config/media";
import { TIER_GROUPS } from "@/config/scales";
import type { Facet } from "@/lib/data/query";
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

function facetTitle(facet: Facet): string {
  switch (facet.kind) {
    case "all":
      return "All characters";
    case "media":
      return `${MEDIA_LABELS[facet.media]} ranking`;
    case "tier":
      return `Tier ${facet.group}: ${TIER_GROUPS[facet.group] ?? "Unknown"}`;
    default:
      return "Results";
  }
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
    go(href, { scroll: true });
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
          <div className="mb-6">
            <SectionHeading title={facetTitle(facet)} aside="Ranking" />
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

        <div className={mode === "list" ? "mt-6" : undefined}>
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
