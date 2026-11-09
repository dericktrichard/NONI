import { describe, expect, it } from "vitest";
import { buildClimb } from "@/lib/battle/climb";
import { estimateWin, simulateClash } from "@/lib/battle/clash";
import type { Entrant } from "@/lib/battle/types";
import { mulberry32 } from "@/lib/play/game";
import { compileProfile } from "@/lib/ranking/profile";

const make = (slug: string, tier: string) =>
  compileProfile({ slug, name: slug, attackPotency: tier, durability: tier, speed: "Supersonic" });

const strong = [make("s1", "5-B"), make("s2", "6-B"), make("s3", "6-C")];
const weak = [make("w1", "9-B"), make("w2", "9-C"), make("w3", "10-A")];

const roster: Entrant[] = Array.from({ length: 14 }, (_, i) => ({
  verse: `v${i % 4}`,
  score: 3000 + i * 200,
  profile: make(`r${String(i).padStart(2, "0")}`, ["9-B", "8-C", "7-C", "7-A", "6-C", "6-B", "5-B"][i % 7]!),
}));

describe("sampled fights", () => {
  it("lets the weaker side win when the dice fall that way", () => {
    const sure = simulateClash(strong, weak);
    const unlucky = simulateClash(strong, weak, { rng: () => 0.999 });
    expect(sure.winner).toBe("a");
    expect(unlucky.winner).toBe("b");
    expect(unlucky.fights.every((fight) => fight.upset)).toBe(true);
    expect(sure.fights.some((fight) => fight.upset)).toBe(false);
  });

  it("is repeatable for a given seed and varies between seeds", () => {
    const one = simulateClash(strong, weak, { rng: mulberry32(5) });
    expect(simulateClash(strong, weak, { rng: mulberry32(5) })).toEqual(one);
    const winners = new Set(Array.from({ length: 60 }, (_, i) => simulateClash(strong, weak, { rng: mulberry32(i) }).winner));
    expect(winners.size).toBeGreaterThan(0);
  });
});

describe("estimateWin", () => {
  const rngFor = (run: number) => mulberry32(run + 1);

  it("favours the stronger team", () => {
    const chance = estimateWin(strong, weak, 300, rngFor);
    expect(chance).toBeGreaterThan(0.8);
    expect(chance).toBeLessThanOrEqual(1);
  });

  it("mirrors when the teams swap", () => {
    const a = estimateWin(strong, weak, 300, rngFor);
    const b = estimateWin(weak, strong, 300, rngFor);
    expect(Math.abs(a + b - 1)).toBeLessThan(0.05);
  });
});

describe("sampled climb", () => {
  it("gives the same hero different results across seeds", () => {
    const hero = roster[9]!;
    const wins = new Set(Array.from({ length: 40 }, (_, i) => buildClimb(roster, hero, 8, "counters", "fair", mulberry32(i), true)!.wins));
    expect(wins.size).toBeGreaterThan(1);
  });

  it("stays deterministic without sampling", () => {
    const hero = roster[9]!;
    const a = buildClimb(roster, hero, 8, "counters", "fair", mulberry32(3));
    expect(buildClimb(roster, hero, 8, "counters", "fair", mulberry32(3))).toEqual(a);
  });
});