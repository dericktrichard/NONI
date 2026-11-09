import { describe, expect, it } from "vitest";
import { GLAZE, climbNet, climbSettlement, clashSettlement, dayKey, grantable, isStake, stakeMultiplier, underdogFactor } from "@/lib/glaze/rules";

describe("stakes", () => {
  it("only allows the listed amounts", () => {
    expect(isStake(0)).toBe(true);
    expect(isStake(25)).toBe(true);
    expect(isStake(30)).toBe(false);
    expect(isStake(-10)).toBe(false);
  });

  it("pays long odds more and keeps a house edge at every chance", () => {
    expect(stakeMultiplier(0.25)).toBeGreaterThan(stakeMultiplier(0.75));
    for (const chance of [0.2, 0.35, 0.5, 0.65, 0.8, 0.95]) {
      const expected = chance * stakeMultiplier(chance) - (1 - chance);
      expect(expected).toBeLessThan(0.0000001);
    }
  });
});

describe("clashSettlement", () => {
  const base = { chance: 0.5, survivors: 2, edge: 0.5 };

  it("takes the stake on a loss and pays on a win", () => {
    expect(clashSettlement({ ...base, stake: 25, outcome: "loss" })).toEqual({ delta: -25, earned: false });
    expect(clashSettlement({ ...base, stake: 25, outcome: "win" }).delta).toBeGreaterThan(0);
    expect(clashSettlement({ ...base, stake: 25, outcome: "draw" }).delta).toBe(0);
  });

  it("pays an underdog win more than a favourite win", () => {
    const long = clashSettlement({ ...base, stake: 50, outcome: "win", chance: 0.25 }).delta;
    const short = clashSettlement({ ...base, stake: 50, outcome: "win", chance: 0.8 }).delta;
    expect(long).toBeGreaterThan(short);
  });

  it("pays free play a capped reward that never goes negative", () => {
    const win = clashSettlement({ ...base, stake: 0, outcome: "win" });
    const loss = clashSettlement({ ...base, stake: 0, outcome: "loss" });
    expect(win.earned).toBe(true);
    expect(loss.delta).toBeGreaterThan(0);
    expect(win.delta).toBeGreaterThan(loss.delta);
    expect(underdogFactor(0.2)).toBeGreaterThan(underdogFactor(0.8));
  });
});

describe("climbSettlement", () => {
  const input = { rounds: 3, mode: "counters", strength: "fair" } as const;

  it("loses the whole stake on an early exit and wins big for the title", () => {
    expect(climbSettlement({ ...input, stake: 25, wins: 0 }).delta).toBe(-25);
    expect(climbSettlement({ ...input, stake: 25, wins: 3 }).delta).toBeGreaterThan(25);
  });

  it("never costs more than the stake and rises with every round", () => {
    const nets = [0, 1, 2, 3].map((wins) => climbNet(wins, 3, "counters", "fair"));
    expect(nets[0]).toBe(-1);
    expect(nets.every((net, i) => i === 0 || net > nets[i - 1]!)).toBe(true);
  });

  it("pays hard counters more than fair ones", () => {
    expect(climbNet(3, 3, "counters", "hard")).toBeGreaterThan(climbNet(3, 3, "counters", "fair"));
  });

  it("pays free play capped rewards", () => {
    expect(climbSettlement({ ...input, stake: 0, wins: 0 })).toEqual({ delta: 1, earned: true });
  });
});

describe("daily cap", () => {
  it("never grants past the cap", () => {
    expect(grantable(0, 20)).toBe(20);
    expect(grantable(GLAZE.dailyEarnCap - 5, 20)).toBe(5);
    expect(grantable(GLAZE.dailyEarnCap, 20)).toBe(0);
  });
  it("keys days in UTC", () => {
    expect(dayKey(new Date("2026-11-08T23:59:59Z"))).toBe("2026-11-08");
  });
});