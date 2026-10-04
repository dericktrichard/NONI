import { describe, expect, it } from "vitest";
import { AP_TIERS, SPEED_LEVELS, apIndex, speedIndex } from "@/config/scales";
import { evaluateField, findCycles, rankField, selectField } from "@/lib/ranking/field";
import { resolveMatchup, winProbability } from "@/lib/ranking/matchup";
import {
  applyVerifiedClaims,
  compileProfile,
  isValidClaim,
  type FeatClaim,
  type ProfileInput,
} from "@/lib/ranking/profile";

const make = (input: Partial<ProfileInput> & { slug: string }) =>
  compileProfile({
    name: input.slug,
    attackPotency: "10-B",
    durability: "10-B",
    speed: "Normal Human",
    ...input,
  });

describe("scales", () => {
  it("has unique, ordered rungs", () => {
    expect(new Set(AP_TIERS.map((t) => t.id)).size).toBe(AP_TIERS.length);
    expect(new Set(SPEED_LEVELS).size).toBe(SPEED_LEVELS.length);
    expect(AP_TIERS[0].id).toBe("11-C");
    expect(AP_TIERS[AP_TIERS.length - 1].id).toBe("0");
    expect(apIndex("7-B")).toBeLessThan(apIndex("7-A"));
    expect(apIndex("High 7-A")).toBeLessThan(apIndex("6-C"));
    expect(speedIndex("Hypersonic")).toBeLessThan(speedIndex("FTL"));
    expect(speedIndex("Immeasurable")).toBeLessThan(speedIndex("Irrelevant"));
  });

  it("rejects unknown ids", () => {
    expect(() => apIndex("S+")).toThrow();
    expect(() => speedIndex("Fast")).toThrow();
  });
});

describe("compileProfile", () => {
  it("derives dimension from the tiers unless overridden", () => {
    expect(make({ slug: "a", attackPotency: "7-B" }).dimension).toBe(3);
    expect(make({ slug: "a", attackPotency: "Low 2-C" }).dimension).toBe(4);
    expect(make({ slug: "a", attackPotency: "1-C", durability: "1-C" }).dimension).toBe(7);
    expect(make({ slug: "a", attackPotency: "7-B", dimension: 5 }).dimension).toBe(5);
  });

  it("validates dimensions and ability kinds", () => {
    expect(() => make({ slug: "a", dimension: 2 })).toThrow();
    expect(() => make({ slug: "a", dimension: 3.5 })).toThrow();
    expect(() => make({ slug: "a", hax: [{ kind: "teleport" as never, power: "7-A" }] })).toThrow();
  });

  it("keeps the strongest claim per ability kind", () => {
    const p = make({
      slug: "a",
      hax: [
        { kind: "sealing", power: "7-A" },
        { kind: "sealing", power: "5-B" },
      ],
    });
    expect(p.hax).toEqual([{ kind: "sealing", power: apIndex("5-B") }]);
  });
});

describe("resolver basics", () => {
  const cosmic = make({ slug: "cosmic", attackPotency: "3-A", durability: "3-A", speed: "FTL" });
  const city = make({ slug: "city", attackPotency: "7-B", durability: "7-B", speed: "FTL" });

  it("lets a far higher tier win decisively at equal speed", () => {
    const r = resolveMatchup(cosmic, city);
    expect(r.winner).toBe("a");
    expect(r.verdict).toBe("decisive");
    expect(resolveMatchup(city, cosmic).winner).toBe("b");
  });

  it("is antisymmetric: swapping sides swaps the probability", () => {
    const pairs = [
      [cosmic, city],
      [city, make({ slug: "x", attackPotency: "6-B", speed: "Hypersonic" })],
    ] as const;
    for (const [a, b] of pairs) {
      expect(winProbability(a, b) + winProbability(b, a)).toBeCloseTo(1, 10);
    }
  });

  it("calls identical characters even", () => {
    const r = resolveMatchup(city, { ...city, slug: "twin", name: "twin" });
    expect(r.probabilityA).toBeCloseTo(0.5, 10);
    expect(r.winner).toBeNull();
  });

  it("gives the faster character the edge at equal power", () => {
    const base = { attackPotency: "7-A", durability: "7-A" };
    const quick = make({ slug: "quick", ...base, speed: "Relativistic" });
    const slow = make({ slug: "slow", ...base, speed: "Supersonic" });
    expect(winProbability(quick, slow)).toBeGreaterThan(0.75);
  });

  it("does not let speed alone beat someone you cannot hurt", () => {
    const blur = make({ slug: "blur", attackPotency: "9-C", durability: "9-C", speed: "Relativistic" });
    const tank = make({ slug: "tank", attackPotency: "7-A", durability: "7-A", speed: "Supersonic" });
    expect(resolveMatchup(blur, tank).winner).toBe("b");
    expect(winProbability(blur, tank)).toBeLessThan(0.1);
  });

  it("never uses randomness", () => {
    const first = resolveMatchup(cosmic, city);
    for (let i = 0; i < 20; i++) expect(resolveMatchup(cosmic, city)).toEqual(first);
  });

  it("explains itself without em dashes", () => {
    const r = resolveMatchup(cosmic, city);
    expect(r.reasons.length).toBeGreaterThan(1);
    for (const reason of r.reasons) expect(reason.note.includes("—")).toBe(false);
  });
});

describe("abilities", () => {
  const tank = {
    slug: "tank",
    attackPotency: "7-A",
    durability: "7-A",
    speed: "Supersonic",
  };
  const caster = {
    slug: "caster",
    attackPotency: "9-C",
    durability: "9-C",
    speed: "Relativistic",
    hax: [{ kind: "soul-manipulation" as const, power: "7-A" }],
  };

  it("lets a landed ability beat a stronger body", () => {
    const r = resolveMatchup(make(caster), make(tank));
    expect(r.winner).toBe("a");
    expect(r.reasons.some((x) => x.code === "hax_lands")).toBe(true);
  });

  it("is blocked by a matching resistance of equal or higher power", () => {
    const warded = make({ ...tank, resistances: [{ kind: "soul-manipulation", power: "7-A" }] });
    const r = resolveMatchup(make(caster), warded);
    expect(r.winner).toBe("b");
    expect(r.reasons.some((x) => x.code === "hax_blocked")).toBe(true);
  });

  it("is not blocked by a weaker resistance", () => {
    const weakWard = make({ ...tank, resistances: [{ kind: "soul-manipulation", power: "9-C" }] });
    expect(resolveMatchup(make(caster), weakWard).winner).toBe("a");
  });

  it("is blocked entirely by nullification", () => {
    const nullifier = make({ ...tank, resistances: [{ kind: "nullification", power: "7-A" }] });
    expect(resolveMatchup(make(caster), nullifier).winner).toBe("b");
  });

  it("is attenuated when far out of scope", () => {
    const god = { slug: "god", attackPotency: "3-A", durability: "3-A", speed: "FTL" };
    const small = make({ ...caster, hax: [{ kind: "sealing", power: "9-C" }] });
    const scoped = make({ ...caster, hax: [{ kind: "sealing", power: "3-A" }] });
    const weak = resolveMatchup(small, make(god)).offenseA;
    const strong = resolveMatchup(scoped, make(god)).offenseA;
    expect(weak).toBeLessThan(strong);
  });
});

describe("dimensions", () => {
  const fourD = make({ slug: "fourd", attackPotency: "6-B", durability: "6-B", dimension: 4 });
  const threeD = make({ slug: "threed", attackPotency: "4-B", durability: "4-B" });

  it("stalls when a stronger 3D character cannot reach a 4D one", () => {
    const r = resolveMatchup(threeD, fourD);
    expect(r.verdict).toBe("stalemate");
    expect(r.winner).toBeNull();
    expect(r.probabilityA).toBe(0.5);
  });

  it("lets dimensional reach remove the gate", () => {
    const reaching = make({
      slug: "reaching",
      attackPotency: "4-B",
      durability: "4-B",
      hax: [{ kind: "dimensional-reach", power: "4-B" }],
    });
    expect(resolveMatchup(reaching, fourD).winner).toBe("a");
  });

  it("lets the higher dimension win once it can hurt", () => {
    const strong4d = make({ slug: "strong4d", attackPotency: "4-B", durability: "4-B", dimension: 4 });
    expect(resolveMatchup(strong4d, threeD).winner).toBe("a");
  });
});

describe("intransitive matchups", () => {
  const brute = make({
    slug: "brute",
    attackPotency: "7-A",
    durability: "7-A",
    speed: "Supersonic",
  });
  const mage = make({
    slug: "mage",
    attackPotency: "9-C",
    durability: "9-C",
    speed: "Relativistic",
    hax: [{ kind: "soul-manipulation", power: "7-A" }],
  });
  const warden = make({
    slug: "warden",
    attackPotency: "8-A",
    durability: "8-A",
    speed: "Supersonic",
    resistances: [{ kind: "soul-manipulation", power: "7-A" }],
  });

  it("keeps rock-paper-scissors results as they are", () => {
    expect(winProbability(mage, brute)).toBeGreaterThan(0.6);
    expect(winProbability(brute, warden)).toBeGreaterThan(0.6);
    expect(winProbability(warden, mage)).toBeGreaterThan(0.6);
  });

  it("detects the loop", () => {
    expect(findCycles([warden, brute, mage])).toEqual([["brute", "warden", "mage"]]);
  });

  it("finds nothing in a clean power ladder", () => {
    const ladder = ["10-A", "8-A", "7-B", "6-B", "5-B"].map((t, i) =>
      make({ slug: `l${i}`, attackPotency: t, durability: t, speed: "Supersonic" }),
    );
    expect(findCycles(ladder)).toEqual([]);
  });
});

describe("field ranking", () => {
  const cast = [
    make({ slug: "god", attackPotency: "3-A", durability: "3-A", speed: "FTL" }),
    make({ slug: "star", attackPotency: "4-C", durability: "4-C", speed: "Relativistic" }),
    make({ slug: "city", attackPotency: "7-B", durability: "7-B", speed: "Supersonic" }),
    make({ slug: "human", attackPotency: "10-B", durability: "10-B", speed: "Normal Human" }),
  ];

  it("orders by strength and keeps scores in range", () => {
    const ranked = rankField(cast);
    expect(ranked.map((r) => r.slug)).toEqual(["god", "star", "city", "human"]);
    for (const r of ranked) {
      expect(r.score).toBeGreaterThan(-1);
      expect(r.score).toBeLessThan(10001);
    }
    expect(ranked[0].wins).toBe(3);
    expect(ranked[3].losses).toBe(3);
  });

  it("does not depend on input order", () => {
    const a = rankField(cast);
    const b = rankField([...cast].reverse());
    expect(b).toEqual(a);
  });

  it("limits each character to a deterministic field when the roster is large", () => {
    const many = Array.from({ length: 10 }, (_, i) =>
      make({ slug: `c${String(i).padStart(2, "0")}`, attackPotency: AP_TIERS[i + 3].id, durability: AP_TIERS[i + 3].id }),
    );
    const field = selectField(many, 4);
    expect(field.map((p) => p.slug)).toEqual(["c00", "c02", "c05", "c07"]);
    const entries = evaluateField(many, { cap: 4 });
    for (const e of entries) expect(e.opponents).toBeLessThan(5);
    expect(evaluateField(many, { cap: 4 })).toEqual(entries);
  });

  it("handles a lone character", () => {
    expect(evaluateField([cast[0]])[0].winRate).toBe(0.5);
  });
});

describe("applyVerifiedClaims", () => {
  const seed: ProfileInput = {
    slug: "x",
    name: "X",
    attackPotency: "9-C",
    durability: "9-C",
    speed: "Peak Human",
    hax: [{ kind: "sealing", power: "9-C" }],
  };
  const f = (claim: FeatClaim, status: "pending" | "verified" | "rejected") => ({ claim, status });

  it("uses the highest verified claim and ignores the rest", () => {
    const out = applyVerifiedClaims(seed, [
      f({ category: "attackPotency", tier: "7-B" }, "verified"),
      f({ category: "attackPotency", tier: "6-C" }, "verified"),
      f({ category: "attackPotency", tier: "3-A" }, "pending"),
      f({ category: "speed", level: "Relativistic" }, "rejected"),
    ]);
    expect(out.attackPotency).toBe("6-C");
    expect(out.speed).toBe("Peak Human");
    expect(out.durability).toBe("9-C");
    expect(out.verifiedFeatCount).toBe(2);
  });

  it("replaces abilities per kind and keeps unverified seeds", () => {
    const out = applyVerifiedClaims(seed, [
      f({ category: "hax", kind: "time-manipulation", power: "5-B" }, "verified"),
      f({ category: "resistance", kind: "sealing", power: "5-B" }, "verified"),
    ]);
    expect(out.hax).toEqual([
      { kind: "sealing", power: "9-C" },
      { kind: "time-manipulation", power: "5-B" },
    ]);
    expect(out.resistances).toEqual([{ kind: "sealing", power: "5-B" }]);
  });

  it("skips claims that name things not on our scales", () => {
    const bad = { category: "attackPotency", tier: "S+" } as FeatClaim;
    expect(isValidClaim(bad)).toBe(false);
    expect(applyVerifiedClaims(seed, [f(bad, "verified")]).attackPotency).toBe("9-C");
  });
});
