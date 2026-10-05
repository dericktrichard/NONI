import { isMediaType } from "@/config/media";
import { TIER_GROUPS } from "@/config/scales";
import { SLUG_RE } from "@/lib/firebase/paths";
import type { MediaType } from "@/types/character";

export const PAGE = { default: 24, max: 50 } as const;
export const SEARCH = { minLength: 2, maxLength: 12, maxInput: 60 } as const;

/**
 * Only one filter applies at a time. If a request carries several, the first
 * of search, verse, scale and media wins. That keeps every query on a single
 * index, so the indexes stay few and every filtered page stays cheap.
 */
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
  /** Page size the caller asked for */
  limit: number;
  /** Documents to read: one more than the page, to learn whether another page exists */
  fetch: number;
  /** Rank of the last character on the previous page, or null for the first page */
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

/**
 * Turns what a person typed into the one word we search on. It uses the same
 * cleanup as buildSearchKeys, and picks the longest word because longer words
 * narrow the results the most. Returns null if nothing searchable is left.
 */
export function searchTerm(text: string): string | null {
  const words = text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length >= SEARCH.minLength);

  if (words.length === 0) return null;

  let best = words[0];
  for (const word of words) if (word.length > best.length) best = word;
  return best.slice(0, SEARCH.maxLength);
}

const fail = (error: string): ParseResult => ({ ok: false, error });

/** Validates request parameters by hand, so the rules are visible and testable. */
export function parseCharacterQuery(params: URLSearchParams): ParseResult {
  const read = (key: string) => {
    const value = params.get(key)?.trim();
    return value ? value : undefined;
  };

  let limit: number = PAGE.default;
  const rawLimit = read("limit");
  if (rawLimit !== undefined) {
    if (!/^\d{1,4}$/.test(rawLimit)) return fail("limit must be a whole number.");
    limit = Math.min(PAGE.max, Math.max(1, Number(rawLimit)));
  }

  let after: number | null = null;
  const rawAfter = read("after");
  if (rawAfter !== undefined) {
    if (!/^\d{1,7}$/.test(rawAfter)) return fail("after must be a whole number.");
    after = Number(rawAfter);
  }

  let media: MediaType | undefined;
  const rawMedia = read("media");
  if (rawMedia !== undefined) {
    if (!isMediaType(rawMedia)) return fail("Unknown media type.");
    media = rawMedia;
  }

  let group: number | undefined;
  const rawTier = read("tier");
  if (rawTier !== undefined) {
    if (!/^\d{1,2}$/.test(rawTier) || !Object.hasOwn(TIER_GROUPS, rawTier)) {
      return fail("Unknown tier group.");
    }
    group = Number(rawTier);
  }

  let verseId: string | undefined;
  const rawVerse = read("verse");
  if (rawVerse !== undefined) {
    if (rawVerse.length > 80 || !SLUG_RE.test(rawVerse)) return fail("Unknown verse.");
    verseId = rawVerse;
  }

  let term: string | undefined;
  const rawQuery = read("q");
  if (rawQuery !== undefined) {
    const found = rawQuery.length > SEARCH.maxInput ? null : searchTerm(rawQuery);
    if (found === null) {
      return fail("Search needs at least two letters or digits. Only Latin letters are supported for now.");
    }
    term = found;
  }

  const facet: Facet =
    term !== undefined
      ? { kind: "search", term }
      : verseId !== undefined
        ? { kind: "verse", verseId }
        : group !== undefined
          ? { kind: "tier", group }
          : media !== undefined
            ? { kind: "media", media }
            : { kind: "all" };

  return { ok: true, plan: makePlan(facet, limit, after) };
}

/** The browser builds requests with this, so client and server always agree on names */
export function facetQueryString(facet: Facet, after: number | null): string {
  const params = new URLSearchParams();
  switch (facet.kind) {
    case "search":
      params.set("q", facet.term);
      break;
    case "verse":
      params.set("verse", facet.verseId);
      break;
    case "tier":
      params.set("tier", String(facet.group));
      break;
    case "media":
      params.set("media", facet.media);
      break;
    case "all":
      break;
  }
  if (after !== null) params.set("after", String(after));
  return params.toString();
}
