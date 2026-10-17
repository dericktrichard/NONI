import { describe, expect, it } from "vitest";
import { buildClaim, claimLabel, tierText, type ClaimFields } from "@/lib/feats/labels";

const empty: ClaimFields = { category: "speed", tier: "", level: "", dimension: 0, kind: "", power: "" };

describe("buildClaim", () => {
  it("returns null until the needed fields are filled", () => {
    for (const category of ["attackPotency", "durability", "speed", "dimension", "hax", "resistance"] as const) {
      expect(buildClaim({ ...empty, category })).toBeNull();
    }
  });

  it("builds a valid claim for each category", () => {
    expect(buildClaim({ ...empty, category: "attackPotency", tier: "5-B" })).toEqual({ category: "attackPotency", tier: "5-B" });
    expect(buildClaim({ ...empty, category: "speed", level: "Relativistic" })).toEqual({ category: "speed", level: "Relativistic" });
    expect(buildClaim({ ...empty, category: "dimension", dimension: 5 })).toEqual({ category: "dimension", dimension: 5 });
    expect(buildClaim({ ...empty, category: "hax", kind: "sealing", power: "5-B" })).toEqual({
      category: "hax",
      kind: "sealing",
      power: "5-B",
    });
  });

  it("rejects values outside the scales", () => {
    expect(buildClaim({ ...empty, category: "attackPotency", tier: "Z-9" })).toBeNull();
    expect(buildClaim({ ...empty, category: "speed", level: "Warp" })).toBeNull();
    expect(buildClaim({ ...empty, category: "dimension", dimension: 99 })).toBeNull();
    expect(buildClaim({ ...empty, category: "hax", kind: "toString" as never, power: "5-B" })).toBeNull();
  });
});

describe("claimLabel", () => {
  it("describes each claim in plain words", () => {
    expect(claimLabel({ category: "speed", level: "Relativistic" })).toBe("Speed: Relativistic");
    expect(claimLabel({ category: "attackPotency", tier: "5-B" }).startsWith("Attack potency: 5-B ")).toBe(true);
    expect(claimLabel({ category: "hax", kind: "sealing", power: "5-B" }).startsWith("Ability: Sealing, 5-B ")).toBe(true);
    expect(claimLabel({ category: "dimension", dimension: 4 }).startsWith("Dimensionality: ")).toBe(true);
  });

  it("falls back to the raw id for unknown tiers", () => {
    expect(tierText("Z-9")).toBe("Z-9");
  });
});