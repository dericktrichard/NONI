import { describe, expect, it } from "vitest";
import {
  DEFAULT_PLAN,
  MAX_AFTER,
  PAGE,
  canonicalQuery,
  facetQueryString,
  isCanonicalSearch,
  parseCharacterQuery,
  searchTerm,
  type Facet,
} from "@/lib/data/query";
import { buildSearchKeys } from "@/lib/search-keys";

const parse = (query: string) => parseCharacterQuery(new URLSearchParams(query));

describe("parseCharacterQuery", () => {
  it("defaults to the first page of everyone", () => {
    const result = parse("");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.plan).toEqual(DEFAULT_PLAN);
      expect(result.plan.where).toBeNull();
      expect(result.plan.limit).toBe(PAGE.default);
      expect(result.plan.fetch).toBe(PAGE.default + 1);
      expect(result.plan.after).toBeNull();
    }
  });

  it("builds one where clause per facet", () => {
    const cases: Array<[string, unknown]> = [
      ["media=manga", { field: "media", op: "==", value: "manga" }],
      ["tier=3", { field: "tierGroup", op: "==", value: 3 }],
      ["tier=0", { field: "tierGroup", op: "==", value: 0 }],
      ["verse=dragon-ball", { field: "verseId", op: "==", value: "dragon-ball" }],
      ["q=gojo", { field: "searchKeys", op: "array-contains", value: "gojo" }],
    ];
    for (const [query, where] of cases) {
      const result = parse(query);
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.plan.where).toEqual(where);
    }
  });

  it("accepts a cursor and a page size inside their ranges", () => {
    const result = parse(`after=${MAX_AFTER}&limit=${PAGE.max}&media=anime`);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.plan.after).toBe(MAX_AFTER);
      expect(result.plan.limit).toBe(PAGE.max);
    }
    const first = parse("after=0&limit=1");
    expect(first.ok && first.plan.after).toBe(0);
    expect(first.ok && first.plan.limit).toBe(1);
  });

  it("rejects more than one filter", () => {
    for (const query of ["media=manga&tier=4", "media=manga&q=goku", "q=goku&tier=4", "tier=4&verse=one-piece"]) {
      expect(parse(query).ok).toBe(false);
    }
  });

  it("rejects unknown, repeated, empty and out of order parameters", () => {
    for (const query of [
      "junk=1",
      "media=manga&junk=1",
      "media=manga&media=anime",
      "media=",
      "q=",
      "after=",
      "media=manga&after=5",
      "q=goku&limit=5",
      "Media=manga",
    ]) {
      expect(parse(query).ok).toBe(false);
    }
  });

  it("rejects values that are not in canonical form", () => {
    for (const query of [
      "media=%20manga",
      "media=Manga",
      "tier=03",
      "tier=+3",
      "after=007",
      "limit=05",
      "q=Gojo",
      "q=gojo%20satoru",
      "q=goku%21",
      "q=goku%20",
    ]) {
      expect(parse(query).ok).toBe(false);
    }
  });

  it("rejects bad values with a plain message", () => {
    for (const query of [
      "media=cartoon",
      "tier=12",
      "tier=abc",
      "tier=-1",
      "verse=Not%20A%20Slug",
      "after=-5",
      "after=1.5",
      `after=${MAX_AFTER + 1}`,
      "limit=ten",
      "limit=0",
      `limit=${PAGE.max + 1}`,
      "limit=500",
      "q=a",
      "q=%21%21",
      `q=${"x".repeat(61)}`,
    ]) {
      const result = parse(query);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.length).toBeGreaterThan(5);
        expect(result.error.includes(String.fromCharCode(8212))).toBe(false);
      }
    }
  });

  it("never reflects the input back in an error", () => {
    const result = parse("media=%3Cscript%3Ealert(1)%3C/script%3E");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.includes("script")).toBe(false);
  });
});

describe("searchTerm", () => {
  it("picks the longest usable word, lowercased and accent free", () => {
    expect(searchTerm("Gojo Satoru")).toBe("satoru");
    expect(searchTerm("  GOKU  ")).toBe("goku");
    expect(searchTerm("Pokémon")).toBe("pokemon");
    expect(searchTerm("a goku")).toBe("goku");
  });

  it("caps the term at the longest prefix we index", () => {
    expect(searchTerm("supercalifragilistic")).toBe("supercalifra");
  });

  it("returns null when nothing is searchable", () => {
    expect(searchTerm("a")).toBeNull();
    expect(searchTerm("!!")).toBeNull();
    expect(searchTerm("")).toBeNull();
  });

  it("only ever produces words that buildSearchKeys indexed", () => {
    const names = ["Gojo Satoru", "Pokémon", "Sung Jin-woo", "Misfit of Demon King Academy"];
    const keys = new Set(buildSearchKeys(names));
    for (const typed of ["satoru", "poke", "JIN", "demon k", "academy", "Pokémon", "Gojo Satoru"]) {
      expect(keys.has(searchTerm(typed)!)).toBe(true);
    }
  });

  it("is idempotent, so a term the client sends passes the server check", () => {
    for (const typed of ["Gojo Satoru", "Pokémon", "GOKU", "supercalifragilistic", "a goku"]) {
      const term = searchTerm(typed)!;
      expect(searchTerm(term)).toBe(term);
    }
  });
});

describe("facetQueryString", () => {
  it("round trips through the parser", () => {
    const facets: Facet[] = [
      { kind: "all" },
      { kind: "media", media: "live-action" },
      { kind: "tier", group: 0 },
      { kind: "tier", group: 11 },
      { kind: "verse", verseId: "one-piece" },
      { kind: "search", term: "goku" },
    ];
    for (const facet of facets) {
      for (const after of [null, 0, 48]) {
        const result = parse(facetQueryString(facet, after));
        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.plan.facet).toEqual(facet);
          expect(result.plan.after).toBe(after);
        }
      }
    }
  });

  it("always writes parameters in the one accepted order", () => {
    expect(facetQueryString({ kind: "media", media: "manga" }, 24)).toBe("after=24&media=manga");
    expect(facetQueryString({ kind: "all" }, null)).toBe("");
  });

  it("encodes text safely", () => {
    expect(facetQueryString({ kind: "search", term: "a&b=c d" }, null)).toBe("q=a%26b%3Dc+d");
  });
});

describe("canonical query strings", () => {
  const accepted = (search: string) => {
    const result = parse(search);
    return result.ok && isCanonicalSearch(search, result.plan);
  };

  it("accepts exactly one spelling of each request", () => {
    for (const search of ["", "?", "media=manga", "?media=manga", "after=24&media=manga", "limit=5", "after=5&limit=5&q=goku"]) {
      expect(accepted(search)).toBe(true);
    }
  });

  it("rejects stray separators, explicit defaults and re-encoding", () => {
    for (const search of [
      "media=manga&",
      "&media=manga",
      "media=manga&&",
      `limit=${PAGE.default}&media=manga`,
      "%6Dedia=manga",
      "media=man%67a",
      "verse=one%2Dpiece",
    ]) {
      expect(accepted(search)).toBe(false);
    }
  });

  it("rebuilds the same string the client sends", () => {
    const facets: Facet[] = [{ kind: "all" }, { kind: "media", media: "anime" }, { kind: "tier", group: 4 }, { kind: "search", term: "goku" }];
    for (const facet of facets) {
      for (const after of [null, 12]) {
        const search = facetQueryString(facet, after);
        const result = parse(search);
        expect(result.ok && canonicalQuery(result.plan)).toBe(search);
      }
    }
  });
});