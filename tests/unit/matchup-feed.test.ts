import { describe, expect, it } from "vitest";
import { hotScore, splitFeed, toCard, type MatchupCardData } from "@/lib/matchup/feed";

const stamp = (ms: number) => ({ toMillis: () => ms });

const raw = (over: Record<string, unknown> = {}) => ({
  characterAId: "alpha",
  characterBId: "beta",
  aName: "Alpha",
  bName: "Beta",
  aImageUrl: "https://img.test/a.webp",
  bImageUrl: null,
  votesA: 3,
  votesB: 1,
  argumentCount: 2,
  lastActivityAt: stamp(1000),
  ...over,
});

const card = (id: string, votes: number, args: number, at: number): MatchupCardData =>
  toCard(
    id,
    raw({
      characterAId: id,
      votesA: votes,
      votesB: 0,
      argumentCount: args,
      lastActivityAt: stamp(at),
    }),
  )!;

describe("toCard", () => {
  it("maps a matchup document", () => {
    expect(toCard("alpha_vs_beta", raw())).toEqual({
      id: "alpha_vs_beta",
      a: { slug: "alpha", name: "Alpha", imageUrl: "https://img.test/a.webp" },
      b: { slug: "beta", name: "Beta", imageUrl: null },
      votesA: 3,
      votesB: 1,
      argumentCount: 2,
      lastActivity: 1000,
    });
  });

  it("rejects a document with a missing name", () => {
    expect(toCard("x", raw({ aName: undefined }))).toBeNull();
  });

  it("drops images that are not https", () => {
    expect(
      toCard("x", raw({ aImageUrl: "http://img.test/a.webp" }))?.a.imageUrl,
    ).toBeNull();
  });
});

describe("hotScore", () => {
  it("counts an argument as two votes", () => {
    expect(hotScore({ votesA: 3, votesB: 1, argumentCount: 2 })).toBe(8);
  });
});

describe("splitFeed", () => {
  it("ranks hot by score and keeps the rest in recency order", () => {
    const cards = [
      card("one", 1, 0, 300),
      card("two", 9, 1, 200),
      card("three", 3, 0, 100),
    ];
    const { hot, recent } = splitFeed(cards, 2, 5);
    expect(hot.map((c) => c.id)).toEqual(["two", "three"]);
    expect(recent.map((c) => c.id)).toEqual(["one"]);
  });

  it("returns empty sections for an empty feed", () => {
    expect(splitFeed([])).toEqual({ hot: [], recent: [] });
  });
});
