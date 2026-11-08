import { describe, expect, it } from "vitest";
import { buildClimb, isBracketSize } from "@/lib/battle/climb";
import { checkTeams, effectiveProbability, simulateClash, teamEdge, woundFor } from "@/lib/battle/clash";
import { counterTeam, randomTeam } from "@/lib/battle/counter";
import type { Entrant } from "@/lib/battle/types";
import { mulberry32 } from "@/lib/play/game";
import { compileProfile } from "@/lib/ranking/profile";

const TIERS = ["10-B", "9-B", "8-C", "7-C", "7-A", "6-C", "6-B", "5-B", "High 6-A", "Low 5-B"];
const SPEEDS = ["Normal Human", "Peak Human", "Subsonic", "Supersonic", "Hypersonic", "Relativistic", "FTL"];

const roster: Entrant[] = Array.from({ length: 30 }, (_, i) => {
  const tier = TIERS[i % TIERS.length]!;
  const slug = `c${String(i).padStart(2, "0")}`;
  return {
    verse: `v${i % 6}`,
    score: 3000 + i * 150,
    profile: compileProfile({
      slug,
      name: slug,
      attackPotency: tier,
      durability: tier,
      speed: SPEEDS[i % SPEEDS.length]!,
      verifiedFeatCount: i % 4,
      ...(i % 5 === 0 ? { hax: [{ kind: "sealing", power: tier }] } : {}),
    }),
  };
});

const pick = (...ids: number[]) => ids.map((i) => roster[i]!);
const profiles = (team: Entrant[]) => team.map((e) => e.profile);

describe("team rules", () => {
  it("rejects bad teams", () => {
    expect(checkTeams([], profiles(pick(1)))).toBe("empty");
    expect(checkTeams(profiles(pick(1, 2)), profiles(pick(3)))).toBe("size");
    expect(checkTeams(profiles(pick(1, 1)), profiles(pick(3, 4)))).toBe("duplicate");
    expect(checkTeams(profiles(pick(1, 2)), profiles(pick(2, 3)))).toBe("overlap");
    expect(checkTeams(profiles(pick(1, 2)), profiles(pick(3, 4)))).toBeNull();
  });
});

describe("wounds", () => {
  it("shift the odds and are bounded", () => {
    expect(effectiveProbability(0.5, 1, 1)).toBeCloseTo(0.5, 6);
    expect(effectiveProbability(0.6, 0.3, 1)).toBeLessThan(0.5);
    expect(effectiveProbability(0.6, 1, 0.3)).toBeGreaterThan(0.6);
    expect(woundFor(1)).toBeGreaterThan(0);
    expect(woundFor(0.5)).toBeLessThan(0.81);
  });
});

describe("simulateClash", () => {
  const a = pick(25, 26, 27);
  const b = pick(0, 1, 2);

  it("is deterministic", () => {
    expect(simulateClash(profiles(a), profiles(b))).toEqual(simulateClash(profiles(a), profiles(b)));
  });

  it("lets a far stronger team win with survivors", () => {
    const r = simulateClash(profiles(a), profiles(b));
    expect(r.winner).toBe("a");
    expect(r.survivorsA.length).toBeGreaterThan(0);
    expect(r.survivorsB).toHaveLength(0);
  });

  it("keeps the books straight", () => {
    const r = simulateClash(profiles(a), profiles(b));
    const fallen = r.fights.flatMap((f) => f.fallen);
    expect(new Set(fallen).size).toBe(fallen.length);
    expect(fallen.length + r.survivorsA.length + r.survivorsB.length).toBe(6);
    for (const s of [...r.survivorsA, ...r.survivorsB]) {
      expect(s.vitality).toBeGreaterThan(0);
      expect(s.vitality).toBeLessThan(1.0001);
      expect(fallen).not.toContain(s.slug);
    }
  });

  it("ends when one side is gone", () => {
    for (let i = 0; i < 9; i += 1) {
      const r = simulateClash(profiles(pick(i, i + 10, i + 20)), profiles(pick(i + 1, i + 11, i + 21)));
      expect(r.survivorsA.length === 0 || r.survivorsB.length === 0).toBe(true);
      expect(r.fights.length).toBeGreaterThan(2);
      expect(r.fights.length).toBeLessThan(6);
    }
  });
});

describe("randomTeam", () => {
  it("builds a legal team and honours exclusions", () => {
    const exclude = new Set(roster.slice(0, 10).map((e) => e.profile.slug));
    const team = randomTeam(roster, { size: 5, exclude, rng: mulberry32(7) })!;
    expect(team).toHaveLength(5);
    expect(new Set(team.map((e) => e.profile.slug)).size).toBe(5);
    for (const e of team) expect(exclude.has(e.profile.slug)).toBe(false);
  });

  it("returns null when the pool is too small", () => {
    expect(randomTeam(roster.slice(0, 3), { size: 5, exclude: new Set() })).toBeNull();
  });
});

describe("counterTeam", () => {
  const user = pick(10, 11, 12, 13, 14);
  const exclude = new Set(user.map((e) => e.profile.slug));

  it("never reuses the user's characters", () => {
    const team = counterTeam(roster, user, "hard", { size: 5, exclude })!;
    expect(team).toHaveLength(5);
    for (const e of team) expect(exclude.has(e.profile.slug)).toBe(false);
    expect(checkTeams(profiles(user), profiles(team))).toBeNull();
  });

  it("hard counters beat the user more than fair ones", () => {
    const hard = counterTeam(roster, user, "hard", { size: 5, exclude })!;
    const fair = counterTeam(roster, user, "fair", { size: 5, exclude })!;
    expect(teamEdge(profiles(hard), profiles(user))).toBeGreaterThan(teamEdge(profiles(fair), profiles(user)));
    expect(teamEdge(profiles(hard), profiles(user))).toBeGreaterThan(0.5);
  });

  it("is deterministic without a random source", () => {
    const one = counterTeam(roster, user, "hard", { size: 3, exclude });
    const two = counterTeam(roster, user, "hard", { size: 3, exclude });
    expect(one).toEqual(two);
  });
});

describe("buildClimb", () => {
  const hero = roster[18]!;

  it("validates bracket sizes", () => {
    expect(isBracketSize(8)).toBe(true);
    expect(isBracketSize(6)).toBe(false);
    expect(buildClimb(roster, hero, 6, "random", "fair")).toBeNull();
    expect(buildClimb(roster.slice(0, 5), hero, 8, "random", "fair")).toBeNull();
  });

  it("plays a full bracket with unique entrants", () => {
    const r = buildClimb(roster, hero, 16, "counters", "fair", mulberry32(3))!;
    expect(r.rounds).toHaveLength(4);
    expect(r.rounds.map((m) => m.length)).toEqual([8, 4, 2, 1]);
    const first = r.rounds[0]!.flatMap((m) => [m.a, m.b]);
    expect(new Set(first).size).toBe(16);
    expect(first).toContain(hero.profile.slug);
    expect(r.wins).toBeGreaterThan(-1);
    expect(r.wins).toBeLessThan(5);
  });

  it("reports the run honestly", () => {
    for (const mode of ["counters", "random"] as const) {
      const r = buildClimb(roster, hero, 8, mode, "hard", mulberry32(11))!;
      if (r.wins === 3) {
        expect(r.champion).toBe(hero.profile.slug);
        expect(r.beatenBy).toBeNull();
      } else {
        expect(r.champion).not.toBe(hero.profile.slug);
        expect(r.beatenBy).not.toBeNull();
      }
    }
  });

  it("makes hard harder than fair", () => {
    let hard = 0;
    let fair = 0;
    for (let i = 0; i < 12; i += 1) {
      hard += buildClimb(roster, roster[20]!, 8, "counters", "hard", mulberry32(i))!.wins;
      fair += buildClimb(roster, roster[20]!, 8, "counters", "fair", mulberry32(i))!.wins;
    }
    expect(fair).toBeGreaterThan(hard - 1);
    expect(fair).toBeLessThan(12 * 3 + 1);
  });
});