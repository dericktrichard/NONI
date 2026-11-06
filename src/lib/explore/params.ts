import { isMediaType } from "@/config/media";
import { TIER_GROUPS } from "@/config/scales";
import type { Facet } from "@/lib/data/query";
import type { MediaType } from "@/types/character";

export type View = "rows" | "grid";

export interface ExploreState {
  mode: "overview" | "list";
  facet: Facet;
  view: View;
}

export interface ExploreTarget {
  media?: MediaType | null;
  tier?: number | null;
  all?: boolean;
}

interface ParamReader {
  get(name: string): string | null;
}

const TIER_PARAM = /^\d{1,2}$/;

export function parseExplore(params: ParamReader): ExploreState {
  const view: View = params.get("view") === "grid" ? "grid" : "rows";
  const media = params.get("media");
  const tier = params.get("tier");

  if (media !== null && isMediaType(media)) {
    return { mode: "list", facet: { kind: "media", media }, view };
  }
  if (tier !== null && TIER_PARAM.test(tier) && Object.hasOwn(TIER_GROUPS, tier)) {
    return { mode: "list", facet: { kind: "tier", group: Number(tier) }, view };
  }
  if (params.get("all") === "1") {
    return { mode: "list", facet: { kind: "all" }, view };
  }
  return { mode: "overview", facet: { kind: "all" }, view };
}

export function exploreHref(target: ExploreTarget, view: View = "rows"): string {
  const params = new URLSearchParams();

  if (target.media) params.set("media", target.media);
  else if (target.tier !== null && target.tier !== undefined) params.set("tier", String(target.tier));
  else if (target.all) params.set("all", "1");

  const filtered = [...params.keys()].length > 0;
  if (filtered && view === "grid") params.set("view", "grid");

  const query = params.toString();
  return query ? `/?${query}` : "/";
}

export function stateHref(state: ExploreState, view: View = state.view): string {
  if (state.mode === "overview") return "/";
  const { facet } = state;
  return exploreHref(
    {
      media: facet.kind === "media" ? facet.media : null,
      tier: facet.kind === "tier" ? facet.group : null,
      all: facet.kind === "all",
    },
    view,
  );
}

export function facetKey(facet: Facet): string {
  switch (facet.kind) {
    case "all":
      return "all";
    case "media":
      return `media:${facet.media}`;
    case "tier":
      return `tier:${facet.group}`;
    case "verse":
      return `verse:${facet.verseId}`;
    case "search":
      return `search:${facet.term}`;
  }
}