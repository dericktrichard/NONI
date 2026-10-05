import { describe, expect, it } from "vitest";
import {
  DEFAULT_PLAN,
  PAGE,
  facetQueryString,
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
      ["q=Gojo", { field: "searchKeys", op: "array-contains", value: "gojo" }],
    ];
    for (const [query, where] of cases) {
      const result = parse(query);
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.plan.where).toEqual(where);
    }
  });

  it("applies only one filter, in the order search, verse, scale, media", () => {
    const all = parse("media=manga&tier=4&verse=one-piece&q=goku");
    expect(all.ok && all.plan.facet.kind).toBe("search");
    const noSearch = parse("media=manga&tier=4&verse=one-piece");
    expect(noSearch.ok && noSearch.plan.facet.kind).toBe("verse");
    const tierMedia = parse("media=manga&tier=4");
    expect(tierMedia.ok && tierMedia.plan.facet.kind).toBe("tier");
  });

  it("clamps the page size and reads the cursor", () => {
    const big = parse("limit=500&after=24");
    expect(big.ok && big.plan.limit).toBe(PAGE.max);
    expect(big.ok && big.plan.after).toBe(24);
    const zero = parse("limit=0");
    expect(zero.ok && zero.plan.limit).toBe(1);
  });

  it("ignores empty parameters", () => {
    const result = parse("media=&q=&after=");
    expect(result.ok && result.plan.facet.kind).toBe("all");
  });

  it("rejects bad input with a plain message", () => {
    for (const query of [
      "media=cartoon",
      "tier=12",
      "tier=abc",
      "tier=-1",
      "verse=Not%20A%20Slug",
      "after=-5",
      "after=1.5",
      "limit=ten",
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

  it("encodes free text safely", () => {
    const query = facetQueryString({ kind: "search", term: "a&b=c d" }, null);
    expect(query).toBe("q=a%26b%3Dc+d");
  });
});
