import { describe, expect, it } from "vitest";
import {
  applyMatchupVote,
  orderPair,
  sharePercent,
  toCanonicalPick,
  toViewPick,
  toViewTally,
} from "@/lib/matchup/vote";

describe("orderPair", () => {
  it("puts the alphabetically first slug first and reports a flip", () => {
    expect(orderPair("gojo", "goku")).toEqual({ first: "gojo", second: "goku", flipped: false });
    expect(orderPair("goku", "gojo")).toEqual({ first: "gojo", second: "goku", flipped: true });
  });
});

describe("pick mapping", () => {
  it("maps a pick to the canonical side and back", () => {
    expect(toCanonicalPick("a", false)).toBe("a");
    expect(toCanonicalPick("a", true)).toBe("b");
    expect(toCanonicalPick("b", true)).toBe("a");
    expect(toCanonicalPick("none", true)).toBeNull();
    expect(toViewPick("a", true)).toBe("b");
    expect(toViewPick(null, false)).toBe("none");
  });

  it("round trips for both orders", () => {
    for (const flipped of [false, true]) {
      for (const pick of ["a", "b", "none"] as const) {
        expect(toViewPick(toCanonicalPick(pick, flipped), flipped)).toBe(pick);
      }
    }
  });
});

describe("toViewTally", () => {
  it("swaps the counts when the URL order is flipped", () => {
    expect(toViewTally({ votesA: 7, votesB: 2 }, false)).toEqual({ a: 7, b: 2 });
    expect(toViewTally({ votesA: 7, votesB: 2 }, true)).toEqual({ a: 2, b: 7 });
  });
});

describe("applyMatchupVote", () => {
  const start = { votesA: 3, votesB: 1 };

  it("adds a first vote", () => {
    expect(applyMatchupVote(start, null, "a")).toEqual({ votesA: 4, votesB: 1 });
    expect(applyMatchupVote(start, null, "b")).toEqual({ votesA: 3, votesB: 2 });
  });

  it("moves a vote from one side to the other", () => {
    expect(applyMatchupVote(start, "a", "b")).toEqual({ votesA: 2, votesB: 2 });
  });

  it("removes a vote", () => {
    expect(applyMatchupVote(start, "b", null)).toEqual({ votesA: 3, votesB: 0 });
  });

  it("never goes below zero", () => {
    expect(applyMatchupVote({ votesA: 0, votesB: 0 }, "a", null)).toEqual({ votesA: 0, votesB: 0 });
  });
});

describe("sharePercent", () => {
  it("handles empty and normal tallies", () => {
    expect(sharePercent(0, 0)).toBe(0);
    expect(sharePercent(1, 4)).toBe(25);
    expect(sharePercent(2, 3)).toBe(67);
  });
});