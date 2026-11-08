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

describe("replayAt", () => {
  it("starts with everyone waiting at full vitality", () => {
    for (const state of replayAt(slugsA, result.fights, 0)) {
      expect(state.status).toBe("waiting");
      expect(state.vitality).toBe(1);
    }
  });

  it("marks only the current fighters as fighting", () => {
    const fighting = [...replayAt(slugsA, result.fights, 1), ...replayAt(slugsB, result.fights, 1)].filter(
      (state) => state.status === "fighting",
    );
    expect(fighting.length).toBeGreaterThan(0);
    expect(fighting.length).toBeLessThan(3);
  });

  it("ends with the engine's survivors standing at their final vitality", () => {
    const end = result.fights.length;
    const standing = [...replayAt(slugsA, result.fights, end), ...replayAt(slugsB, result.fights, end)].filter(
      (state) => state.status === "standing",
    );
    const expected = [...result.survivorsA, ...result.survivorsB];
    expect(standing.map((s) => s.slug).sort()).toEqual(expected.map((s) => s.slug).sort());
    for (const s of expected) expect(standing.find((x) => x.slug === s.slug)!.vitality).toBe(s.vitality);
  });

  it("never revives the fallen", () => {
    let fallen = 0;
    for (let shown = 0; shown <= result.fights.length; shown += 1) {
      const now = [...replayAt(slugsA, result.fights, shown), ...replayAt(slugsB, result.fights, shown)].filter(
        (state) => state.status === "fallen",
      ).length;
      expect(now).toBeGreaterThan(fallen - 1);
      fallen = now;
    }
  });
});