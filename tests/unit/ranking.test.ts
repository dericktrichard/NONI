import { describe, expect, it } from "vitest";
import { STAT_WEIGHTS } from "@/config/ranking";
import { STAT_KEYS } from "@/config/stats";
import { assignRanks, trendOf } from "@/lib/ranking/rank";
import {
  compareCharacters,
  computeScore,
  evidenceCoverage,
  evidenceShare,
  peakRatings,
  resolveStatSheet,
  tierFromScore,
  type StatSheet,
} from "@/lib/ranking/score";
import { decideFeatStatus } from "@/lib/ranking/verification";
import { computeVerseScore, rankVerses } from "@/lib/ranking/verse";

const sheetOf = (n: number): StatSheet =>
  Object.fromEntries(STAT_KEYS.map((k) => [k, n])) as StatSheet;

describe("score", () => {
  it("has weights that sum to 100", () => {
    const total = STAT_KEYS.reduce((sum, k) => sum + STAT_WEIGHTS[k], 0);
    expect(total).toBe(100);
  });

  it("scales with evidence coverage", () => {
    expect(computeScore(sheetOf(100), 8)).toBe(10000);
    expect(computeScore(sheetOf(100), 20)).toBe(10000);
    expect(computeScore(sheetOf(100), 4)).toBe(9000);
    expect(computeScore(sheetOf(100), 0)).toBe(8000);
    expect(computeScore(sheetOf(50), 8)).toBe(5000);
  });

  it("clamps coverage and survives bad input", () => {
    expect(evidenceCoverage(-3)).toBe(0);
    expect(evidenceCoverage(99)).toBe(1);
    expect(computeScore({ ...sheetOf(50), speed: Number.NaN }, 8)).toBe(4000);
  });

  it("is deterministic", () => {
    const a = computeScore(sheetOf(73), 5);
    expect(computeScore(sheetOf(73), 5)).toBe(a);
  });
});

describe("stat resolution", () => {
  it("uses the best verified feat per stat and ignores unverified ones", () => {
    const peaks = peakRatings([
      { stat: "speed", rating: 80, status: "verified" },
      { stat: "speed", rating: 95, status: "verified" },
      { stat: "speed", rating: 100, status: "pending" },
      { stat: "reach", rating: 70, status: "rejected" },
    ]);
    expect(peaks).toEqual({ speed: 95 });
  });

  it("falls back to the seeded baseline where nothing is verified", () => {
    const sheet = resolveStatSheet(sheetOf(40), { speed: 95 });
    expect(sheet.speed).toBe(95);
    expect(sheet.durability).toBe(40);
  });
});

describe("tiers", () => {
  it("assigns tiers at the cutoffs", () => {
    expect(tierFromScore(10000)).toBe("S+");
    expect(tierFromScore(9500)).toBe("S+");
    expect(tierFromScore(9499)).toBe("S");
    expect(tierFromScore(9000)).toBe("S");
    expect(tierFromScore(8999)).toBe("A");
    expect(tierFromScore(8000)).toBe("A");
    expect(tierFromScore(6500)).toBe("B");
    expect(tierFromScore(6499)).toBe("C");
    expect(tierFromScore(0)).toBe("C");
  });

  it("computes evidence share safely", () => {
    expect(evidenceShare(0, 0)).toBe(0);
    expect(evidenceShare(3, 4)).toBe(0.75);
  });
});

describe("feat verification", () => {
  const base = { current: "pending" as const, proofsValid: true };

  it("needs enough votes and a high enough approval ratio", () => {
    expect(decideFeatStatus({ ...base, upvotes: 5, downvotes: 0 })).toBe("verified");
    expect(decideFeatStatus({ ...base, upvotes: 4, downvotes: 0 })).toBe("pending");
    expect(decideFeatStatus({ ...base, upvotes: 6, downvotes: 2 })).toBe("verified");
    expect(decideFeatStatus({ ...base, upvotes: 5, downvotes: 2 })).toBe("pending");
  });

  it("does not flap: verified feats survive moderate dissent", () => {
    const verified = { ...base, current: "verified" as const };
    expect(decideFeatStatus({ ...verified, upvotes: 13, downvotes: 7 })).toBe("verified");
    expect(decideFeatStatus({ ...verified, upvotes: 5, downvotes: 5 })).toBe("pending");
  });

  it("rejects heavily downvoted feats, and rejection is terminal", () => {
    expect(decideFeatStatus({ ...base, upvotes: 0, downvotes: 5 })).toBe("rejected");
    expect(decideFeatStatus({ ...base, upvotes: 1, downvotes: 4 })).toBe("pending");
    expect(
      decideFeatStatus({ ...base, current: "rejected", upvotes: 10, downvotes: 0 }),
    ).toBe("rejected");
  });

  it("respects staff locks and invalid proofs", () => {
    expect(
      decideFeatStatus({ ...base, staffLocked: true, upvotes: 50, downvotes: 0 }),
    ).toBe("pending");
    expect(decideFeatStatus({ ...base, proofsValid: false, upvotes: 50, downvotes: 0 })).toBe(
      "pending",
    );
  });
});

describe("ordering and ranks", () => {
  const c = (slug: string, name: string, score: number, verifiedFeatCount = 0) => ({
    slug,
    name,
    score,
    verifiedFeatCount,
  });

  it("breaks ties by verified feats, then name, then slug", () => {
    const list = [
      c("b", "Beta", 100, 1),
      c("a2", "Alpha", 100, 1),
      c("a1", "Alpha", 100, 1),
      c("z", "Zed", 100, 9),
      c("top", "Top", 200, 0),
    ];
    expect(list.sort(compareCharacters).map((x) => x.slug)).toEqual(["top", "z", "a1", "a2", "b"]);
  });

  it("assigns ranks and trends, and rolls previous ranks only on snapshots", () => {
    const items = [
      { ...c("goku", "Goku", 9712), rank: 1, previousRank: 3 },
      { ...c("saitama", "Saitama", 9840), rank: 2, previousRank: 2 },
      { ...c("new", "Newcomer", 100), rank: null, previousRank: null },
    ];

    const between = assignRanks(items, { rollPrevious: false });
    expect(between.map((r) => [r.slug, r.rank, r.previousRank, r.trend])).toEqual([
      ["saitama", 1, 2, 1],
      ["goku", 2, 3, 1],
      ["new", 3, null, 0],
    ]);

    const snapshot = assignRanks(items, { rollPrevious: true });
    expect(snapshot.find((r) => r.slug === "goku")).toMatchObject({ previousRank: 1, trend: -1 });
    expect(snapshot.find((r) => r.slug === "new")).toMatchObject({ previousRank: null, trend: 0 });
  });

  it("computes trend direction", () => {
    expect(trendOf(2, 5)).toBe(3);
    expect(trendOf(5, 2)).toBe(-3);
    expect(trendOf(4, null)).toBe(0);
  });
});

describe("verses", () => {
  it("needs at least three characters", () => {
    expect(computeVerseScore([9000, 8000])).toBeNull();
  });

  it("blends the peak with the depth of the roster", () => {
    // peak 9000, top five mean 8000: 0.6 * 9000 + 0.4 * 8000 = 8600
    expect(computeVerseScore([9000, 9000, 8000, 7000, 7000, 1000])).toBe(8600);
  });

  it("ranks verses and leaves unranked ones null", () => {
    const ranks = rankVerses([
      { id: "a", name: "Alpha", score: 7000 },
      { id: "b", name: "Beta", score: null },
      { id: "c", name: "Gamma", score: 9000 },
    ]);
    expect(ranks).toEqual([
      { id: "a", rank: 2 },
      { id: "b", rank: null },
      { id: "c", rank: 1 },
    ]);
  });
});