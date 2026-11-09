import { describe, expect, it } from "vitest";
import { simulateClash } from "@/lib/battle/clash";
import { replayAt } from "@/lib/battle/replay";
import { compileProfile } from "@/lib/ranking/profile";

const make = (slug: string, tier: string) =>
  compileProfile({ slug, name: slug, attackPotency: tier, durability: tier, speed: "Supersonic" });

const teamA = [make("a1", "7-A"), make("a2", "7-C"), make("a3", "8-C")];
const teamB = [make("b1", "6-C"), make("b2", "7-A"), make("b3", "9-B")];
const result = simulateClash(teamA, teamB);
const slugsA = teamA.map((p) => p.slug);
const slugsB = teamB.map((p) => p.slug);
const both = (resolved: number, active?: (typeof result.fights)[number]) => [
  ...replayAt(slugsA, result.fights, resolved, active),
  ...replayAt(slugsB, result.fights, resolved, active),
];

describe("replayAt", () => {
  it("starts with everyone waiting at full vitality", () => {
    for (const state of both(0)) {
      expect(state.status).toBe("waiting");
      expect(state.vitality).toBe(1);
    }
  });

  it("marks exactly the two active fighters as fighting", () => {
    const fighting = both(0, result.fights[0]).filter((state) => state.status === "fighting");
    expect(fighting.map((s) => s.slug).sort()).toEqual([result.fights[0]!.a, result.fights[0]!.b].sort());
  });

  it("ends with the engine's survivors standing at their final vitality", () => {
    const standing = both(result.fights.length).filter((state) => state.status === "standing");
    const expected = [...result.survivorsA, ...result.survivorsB];
    expect(standing.map((s) => s.slug).sort()).toEqual(expected.map((s) => s.slug).sort());
    for (const s of expected) expect(standing.find((x) => x.slug === s.slug)!.vitality).toBe(s.vitality);
  });

  it("never revives the fallen", () => {
    let fallen = 0;
    for (let resolved = 0; resolved <= result.fights.length; resolved += 1) {
      const now = both(resolved).filter((state) => state.status === "fallen").length;
      expect(now).toBeGreaterThan(fallen - 1);
      fallen = now;
    }
  });
});