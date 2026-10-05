import { isMediaType } from "@/config/media";
import { TIER_GROUPS } from "@/config/scales";
import { SLUG_RE } from "@/lib/firebase/paths";
import type { MediaType } from "@/types/character";

export const PAGE = { default: 24, max: 50 } as const;
export const SEARCH = { minLength: 2, maxLength: 12, maxInput: 60 } as const;
export const MAX_AFTER = 100_000;

const ALLOWED_KEYS = ["after", "limit", "media", "q", "tier", "verse"];
const FACET_KEYS = ["media", "q", "tier", "verse"];
const WHOLE_NUMBER = /^(0|[1-9]\d{0,6})$/;

export type Facet =
  | { kind: "all" }
  | { kind: "media"; media: MediaType }
  | { kind: "tier"; group: number }
  | { kind: "verse"; verseId: string }
  | { kind: "search"; term: string };

export interface QueryWhere {
  field: "searchKeys" | "verseId" | "tierGroup" | "media";
  op: "==" | "array-contains";
  value: string | number;
}

export interface QueryPlan {
  facet: Facet;
  where: QueryWhere | null;
  limit: number;
  fetch: number;
  after: number | null;
}

export type ParseResult = { ok: true; plan: QueryPlan } | { ok: false; error: string };

function whereFor(facet: Facet): QueryWhere | null {
  switch (facet.kind) {
    case "search":
      return { field: "searchKeys", op: "array-contains", value: facet.term };
    case "verse":
      return { field: "verseId", op: "==", value: facet.verseId };
    case "tier":
      return { field: "tierGroup", op: "==", value: facet.group };
    case "media":
      return { field: "media", op: "==", value: facet.media };
    case "all":
      return null;
  }
}

export function makePlan(facet: Facet, limit: number, after: number | null): QueryPlan {
  return { facet, where: whereFor(facet), limit, fetch: limit + 1, after };
}

export const DEFAULT_PLAN: QueryPlan = makePlan({ kind: "all" }, PAGE.default, null);

export function searchTerm(text: string): string | null {
  const words = text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length >= SEARCH.minLength);

  if (words.length === 0) return null;

  let best = words[0];
  for (const word of words) if (word.length > best.length) best = word;
  return best.slice(0, SEARCH.maxLength);
}

const fail = (error: string): ParseResult => ({ ok: false, error });

export function parseCharacterQuery(params: URLSearchParams): ParseResult {
  const keys = [...params.keys()];

  if (keys.some((key) => !ALLOWED_KEYS.includes(key))) return fail("Unknown parameter.");
  if (new Set(keys).size !== keys.length) return fail("Repeated parameter.");
  if (keys.join() !== [...keys].sort().join()) return fail("Parameters must be in alphabetical order.");
  if (keys.filter((key) => FACET_KEYS.includes(key)).length > 1) return fail("Use one filter at a time.");
  for (const value of params.values()) if (value === "") return fail("Empty parameter.");

  let limit: number = PAGE.default;
  const rawLimit = params.get("limit");
  if (rawLimit !== null) {
    if (!WHOLE_NUMBER.test(rawLimit)) return fail("limit must be a whole number.");
    limit = Number(rawLimit);
    if (limit < 1 || limit > PAGE.max) return fail(`limit must be between 1 and ${PAGE.max}.`);
  }

  let after: number | null = null;
  const rawAfter = params.get("after");
  if (rawAfter !== null) {
    if (!WHOLE_NUMBER.test(rawAfter)) return fail("after must be a whole number.");
    after = Number(rawAfter);
    if (after > MAX_AFTER) return fail("after is out of range.");
  }

  let facet: Facet = { kind: "all" };
  const media = params.get("media");
  const tier = params.get("tier");
  const verse = params.get("verse");
  const q = params.get("q");

  if (media !== null) {
    if (!isMediaType(media)) return fail("Unknown media type.");
    facet = { kind: "media", media };
  } else if (tier !== null) {
    if (!WHOLE_NUMBER.test(tier) || !Object.hasOwn(TIER_GROUPS, tier)) return fail("Unknown tier group.");
    facet = { kind: "tier", group: Number(tier) };
  } else if (verse !== null) {
    if (verse.length > 80 || !SLUG_RE.test(verse)) return fail("Unknown verse.");
    facet = { kind: "verse", verseId: verse };
  } else if (q !== null) {
    if (searchTerm(q) !== q) return fail("Search must be one lowercase word of 2 to 12 letters or digits.");
    facet = { kind: "search", term: q };
  }

  return { ok: true, plan: makePlan(facet, limit, after) };
}

export function facetQueryString(facet: Facet, after: number | null, limit?: number): string {
  const params = new URLSearchParams();
  if (after !== null) params.set("after", String(after));
  if (limit !== undefined) params.set("limit", String(limit));

  switch (facet.kind) {
    case "media":
      params.set("media", facet.media);
      break;
    case "search":
      params.set("q", facet.term);
      break;
    case "tier":
      params.set("tier", String(facet.group));
      break;
    case "verse":
      params.set("verse", facet.verseId);
      break;
    case "all":
      break;
  }

  return params.toString();
}

export function canonicalQuery(plan: QueryPlan): string {
  return facetQueryString(plan.facet, plan.after, plan.limit === PAGE.default ? undefined : plan.limit);
}

export function isCanonicalSearch(search: string, plan: QueryPlan): boolean {
  return search.replace(/^\?/, "") === canonicalQuery(plan);
}