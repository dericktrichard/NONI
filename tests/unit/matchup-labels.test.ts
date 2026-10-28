import { describe, expect, it } from "vitest";
import { favorsText, percentA, verdictText } from "@/lib/matchup/labels";

const names = { a: "Goku", b: "Gojo" };

describe("percentA", () => {
  it("rounds and clamps", () => {
    expect(percentA(0.5)).toBe(50);
    expect(percentA(0.874)).toBe(87);
    expect(percentA(-0.2)).toBe(0);
    expect(percentA(1.4)).toBe(100);
  });

  it("falls back to an even split for bad input", () => {
    expect(percentA(Number.NaN)).toBe(50);
  });
});

describe("verdictText", () => {
  it("names the winner with the strength of the verdict", () => {
    expect(verdictText({ winner: "a", verdict: "decisive" }, names)).toBe("Goku wins decisively");
    expect(verdictText({ winner: "b", verdict: "clear" }, names)).toBe("Gojo wins clearly");
    expect(verdictText({ winner: "a", verdict: "narrow" }, names)).toBe("Goku wins narrowly");
  });

  it("does not name a winner for toss-ups or stalemates", () => {
    expect(verdictText({ winner: null, verdict: "toss-up" }, names)).toBe("Too close to call");
    expect(verdictText({ winner: null, verdict: "stalemate" }, names)).toBe("Stalemate");
  });
});

describe("favorsText", () => {
  it("says who a reason favors", () => {
    expect(favorsText("a", names)).toBe("Favors Goku");
    expect(favorsText("even", names)).toBe("Even");
  });
});