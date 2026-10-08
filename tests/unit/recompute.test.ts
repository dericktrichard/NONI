import { describe, expect, it } from "vitest";
import { isValidClaim, type FeatClaim } from "@/lib/ranking/profile";
import { recomputeProfile } from "@/lib/ranking/recompute";
import type { FeatStatus, PowerProfile } from "@/types/domain";

const seed: PowerProfile = {
  attackPotency: "5-B",
  durability: "5-B",
  speed: "Relativistic",
  dimension: 3,
  hax: [{ kind: "sealing", power: "5-B" }],
  resistances: [],
};

const base = { slug: "test-hero", name: "Test Hero", seed, featCount: 4 };
const feat = (claim: FeatClaim, status: FeatStatus = "verified") => ({ claim, status });

describe("recomputeProfile", () => {
  it("returns the seed when nothing is verified", () => {
    const result = recomputeProfile({ ...base, feats: [feat({ category: "attackPotency", tier: "3-A" }, "pending")] });
    expect(result.profile.attackPotency).toBe("5-B");
    expect(result.verifiedFeatCount).toBe(0);
    expect(result.evidence).toBe(0);
  });

  it("applies verified claims and ignores pending and rejected ones", () => {
    const result = recomputeProfile({
      ...base,
      feats: [
        feat({ category: "attackPotency", tier: "4-C" }),
        feat({ category: "speed", level: "Massively FTL" }),
        feat({ category: "attackPotency", tier: "2-A" }, "rejected"),
        feat({ category: "hax", kind: "time-manipulation", power: "4-C" }),
      ],
    });
    expect(result.tier).toBe("4-C");
    expect(result.profile.speed).toBe("Massively FTL");
    expect(result.speed).toBe("Massively FTL");
    expect(result.profile.hax.some((h) => h.kind === "time-manipulation")).toBe(true);
    expect(result.profile.hax.some((h) => h.kind === "sealing")).toBe(true);
    expect(result.verifiedFeatCount).toBe(3);
    expect(result.evidence).toBe(0.75);
  });

  it("raises dimension when a verified tier implies a higher one", () => {
    const result = recomputeProfile({ ...base, feats: [feat({ category: "attackPotency", tier: "2-A" })] });
    expect(result.profile.dimension).toBeGreaterThan(3);
  });

  it("keeps an explicit higher dimension from a verified claim", () => {
    const result = recomputeProfile({ ...base, feats: [feat({ category: "dimension", dimension: 6 })] });
    expect(result.profile.dimension).toBe(6);
  });

  it("does not mutate the seed", () => {
    const before = JSON.stringify(seed);
    recomputeProfile({ ...base, feats: [feat({ category: "attackPotency", tier: "3-A" })] });
    expect(JSON.stringify(seed)).toBe(before);
  });
});

describe("isValidClaim", () => {
  it("accepts real scale values", () => {
    expect(isValidClaim({ category: "attackPotency", tier: "5-B" })).toBe(true);
    expect(isValidClaim({ category: "speed", level: "Relativistic" })).toBe(true);
    expect(isValidClaim({ category: "hax", kind: "sealing", power: "5-B" })).toBe(true);
  });

  it("rejects values that only look like keys on the object", () => {
    expect(isValidClaim({ category: "hax", kind: "toString" as never, power: "5-B" })).toBe(false);
    expect(isValidClaim({ category: "resistance", kind: "constructor" as never, power: "5-B" })).toBe(false);
  });

  it("rejects unknown tiers, levels and dimensions", () => {
    expect(isValidClaim({ category: "attackPotency", tier: "Z-9" })).toBe(false);
    expect(isValidClaim({ category: "speed", level: "Warp" })).toBe(false);
    expect(isValidClaim({ category: "dimension", dimension: 2 })).toBe(false);
    expect(isValidClaim({ category: "dimension", dimension: 4.5 })).toBe(false);
  });
});