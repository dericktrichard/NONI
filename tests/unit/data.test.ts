import { describe, expect, it } from "vitest";
import { MOCK_CHARACTERS, MOCK_SEEDS } from "@/config/mock-characters";
import { MEDIA_LABELS } from "@/config/media";
import { TIER_GROUPS } from "@/config/scales";
import { PAGE, makePlan, parseCharacterQuery, type Facet, type QueryPlan } from "@/lib/data/query";
import { SUMMARY_FIELDS, assemblePage, toSummary, type CharacterPage } from "@/lib/data/summary";
import { buildCharacterDocs, type CharacterDocData } from "@/lib/ranking/character-doc";

const docs = buildCharacterDocs(MOCK_SEEDS);

/** A stand-in for Firestore that follows the same plan: filter, order by rank, start after, limit */
function run(plan: QueryPlan, source: readonly CharacterDocData[] = docs) {
  const where = plan.where;
  const matching = source.filter((doc) => {
    if (!where) return true;
    const value = (doc as unknown as Record<string, unknown>)[where.field];
    return where.op === "array-contains" ? Array.isArray(value) && value.includes(where.value) : value === where.value;
  });
  const ordered = [...matching].sort((a, b) => (a.rank as number) - (b.rank as number));
  const after = plan.after;
  const rest = after === null ? ordered : ordered.filter((d) => (d.rank as number) > after);
  return rest
    .slice(0, plan.fetch)
    .map((d) => ({ id: d.slug, data: d as unknown as Record<string, unknown> }));
}

function pageThrough(facet: Facet, limit: number): CharacterPage["items"] {
  const items: CharacterPage["items"] = [];
  let after: number | null = null;
  for (let guard = 0; guard < 50; guard++) {
    const page = assemblePage(run(makePlan(facet, limit, after)), limit);
    items.push(...page.items);
    if (page.next === null) return items;
    after = page.next;
  }
  throw new Error("pagination did not finish");
}

const slugsOf = (facet: Facet, limit = 5) => pageThrough(facet, limit).map((c) => c.id);

describe("seed documents", () => {
  it("are ranked 1 to N with no gaps or repeats", () => {
    expect(docs.map((d) => d.rank)).toEqual(docs.map((_, i) => i + 1));
  });

  it("round trip into exactly the summaries the sample roster produces", () => {
    const summaries = docs.map((d) => toSummary(d.slug, d as unknown as Record<string, unknown>));
    expect(summaries).toEqual(MOCK_CHARACTERS);
  });

  it("carry the fields every query filters on", () => {
    for (const doc of docs) {
      expect(typeof doc.verseId).toBe("string");
      expect(doc.verseId).toBe(doc.verseName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""));
      expect(Object.hasOwn(MEDIA_LABELS, doc.media)).toBe(true);
      expect(Object.hasOwn(TIER_GROUPS, String(doc.tierGroup))).toBe(true);
      expect(doc.searchKeys).toContain(doc.name.toLowerCase().split(/\s+/)[0].replace(/[^a-z0-9]/g, "").slice(0, 12));
    }
  });

  it("contain no undefined values, which Firestore refuses to store", () => {
    const walk = (value: unknown, path: string) => {
      expect(value === undefined).toBe(false);
      if (Array.isArray(value)) value.forEach((v, i) => walk(v, `${path}[${i}]`));
      else if (value && typeof value === "object") {
        for (const [k, v] of Object.entries(value)) walk(v, `${path}.${k}`);
      }
    };
    for (const doc of docs) walk(doc, doc.slug);
  });

  it("reject duplicate or malformed slugs", () => {
    const first = MOCK_SEEDS[0];
    expect(() => buildCharacterDocs([first, first])).toThrow();
    expect(() =>
      buildCharacterDocs([{ ...first, profile: { ...first.profile, slug: "Bad Slug" } }]),
    ).toThrow();
  });
});

describe("pagination", () => {
  it("visits every character exactly once, in rank order, whatever the page size", () => {
    for (const limit of [1, 2, 5, 7, 12, 24, PAGE.max]) {
      const slugs = slugsOf({ kind: "all" }, limit);
      expect(slugs).toEqual(MOCK_CHARACTERS.map((c) => c.id));
    }
  });

  it("reports the next cursor only when another page exists", () => {
    const first = assemblePage(run(makePlan({ kind: "all" }, 5, null)), 5);
    expect(first.items.length).toBe(5);
    expect(first.next).toBe(5);

    const exact = assemblePage(run(makePlan({ kind: "all" }, 12, null)), 12);
    expect(exact.items.length).toBe(12);
    expect(exact.next).toBeNull();

    const beyond = assemblePage(run(makePlan({ kind: "all" }, 5, 12)), 5);
    expect(beyond).toEqual({ items: [], next: null });
  });

  it("skips a malformed document without losing the cursor", () => {
    const rows = run(makePlan({ kind: "all" }, 3, null));
    const broken = [{ id: "x", data: { ...rows[1].data, score: "high" } }, ...rows.slice(0, 1), ...rows.slice(2)];
    const page = assemblePage(broken, 3);
    expect(page.items.length).toBe(2);
    expect(page.next).not.toBeNull();
  });
});

describe("filters over the sample roster", () => {
  it("media", () => {
    expect(slugsOf({ kind: "media", media: "comic" })).toEqual(["doctor-manhattan", "superman", "thor"]);
    expect(slugsOf({ kind: "media", media: "live-action" })).toEqual(["neo"]);
  });

  it("scale group", () => {
    expect(slugsOf({ kind: "tier", group: 3 })).toEqual(["doctor-manhattan", "goku"]);
    expect(slugsOf({ kind: "tier", group: 11 })).toEqual([]);
  });

  it("verse", () => {
    expect(slugsOf({ kind: "verse", verseId: "dragon-ball" })).toEqual(["goku"]);
  });

  it("search matches character and verse words by prefix", () => {
    expect(slugsOf({ kind: "search", term: "satoru" })).toEqual(["gojo-satoru"]);
    expect(slugsOf({ kind: "search", term: "sat" })).toEqual(["gojo-satoru"]);
    expect(slugsOf({ kind: "search", term: "dragon" })).toEqual(["goku"]);
    expect(slugsOf({ kind: "search", term: "demon" })).toEqual(["anos-voldigoad"]);
    expect(slugsOf({ kind: "search", term: "zzzz" })).toEqual([]);
  });

  it("paginates inside a filter", () => {
    expect(slugsOf({ kind: "media", media: "manga" }, 1)).toEqual(["saitama", "luffy"]);
  });

  it("work end to end from a raw request", () => {
    const parsed = parseCharacterQuery(new URLSearchParams("limit=1&media=anime"));
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const first = assemblePage(run(parsed.plan), parsed.plan.limit);
    expect(first.items.map((c) => c.id)).toEqual(["goku"]);
    expect(first.next).toBe(2);
  });
});

describe("summary fields", () => {
  it("are all fields the documents actually have", () => {
    for (const field of SUMMARY_FIELDS) expect(field in docs[0]).toBe(true);
  });
});
