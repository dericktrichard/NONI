import { describe, expect, it } from "vitest";
import {
  clashSettlement,
  claimAmount,
  climbNet,
  climbSettlement,
  dayKey,
  isStake,
  nextStreak,
  splitSpend,
  stakeMultiplier,
} from "@/lib/glaze/rules";

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
  const base = { chance: 0.5 };

  it("takes the stake on a loss and pays on a win", () => {
    expect(clashSettlement({ ...base, stake: 25, outcome: "loss" })).toEqual({
      delta: -25,
    });
    expect(clashSettlement({ ...base, stake: 25, outcome: "win" }).delta).toBeGreaterThan(
      0,
    );
    expect(clashSettlement({ ...base, stake: 25, outcome: "draw" }).delta).toBe(0);
  });

  it("pays an underdog win more than a favourite win", () => {
    const long = clashSettlement({
      ...base,
      stake: 50,
      outcome: "win",
      chance: 0.25,
    }).delta;
    const short = clashSettlement({
      ...base,
      stake: 50,
      outcome: "win",
      chance: 0.8,
    }).delta;
    expect(long).toBeGreaterThan(short);
  });

  it("pays nothing for practice play, win or lose", () => {
    expect(clashSettlement({ ...base, stake: 0, outcome: "win" })).toEqual({ delta: 0 });
    expect(clashSettlement({ ...base, stake: 0, outcome: "loss" })).toEqual({ delta: 0 });
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
    expect(climbNet(3, 3, "counters", "hard")).toBeGreaterThan(
      climbNet(3, 3, "counters", "fair"),
    );
  });

  it("pays nothing for practice play", () => {
    expect(climbSettlement({ ...input, stake: 0, wins: 3 })).toEqual({ delta: 0 });
  });
});

describe("daily claim", () => {
  it("pays 20 on day one and rises by 5 a day up to day seven", () => {
    expect(claimAmount(0)).toBe(20);
    expect(claimAmount(1)).toBe(20);
    expect(claimAmount(2)).toBe(25);
    expect(claimAmount(7)).toBe(50);
    expect(claimAmount(30)).toBe(50);
  });

  it("keeps the streak on consecutive days and restarts it after a gap", () => {
    expect(nextStreak(null, "2026-11-13", 0)).toBe(1);
    expect(nextStreak("2026-11-12", "2026-11-13", 3)).toBe(4);
    expect(nextStreak("2026-11-12", "2026-11-13", 7)).toBe(7);
    expect(nextStreak("2026-11-10", "2026-11-13", 5)).toBe(1);
    expect(nextStreak("2026-10-31", "2026-11-01", 2)).toBe(3);
    expect(nextStreak("2026-11-13", "2026-11-13", 4)).toBe(4);
  });

  it("keys days in UTC", () => {
    expect(dayKey(new Date("2026-11-08T23:59:59Z"))).toBe("2026-11-08");
  });
});

describe("splitSpend", () => {
  it("spends bought Glaze before earned Glaze", () => {
    expect(splitSpend(100, 30, 20)).toEqual({ bought: 20, earned: 0 });
    expect(splitSpend(100, 30, 50)).toEqual({ bought: 30, earned: 20 });
  });

  it("refuses amounts that are invalid or more than the player has", () => {
    expect(splitSpend(10, 5, 16)).toBeNull();
    expect(splitSpend(10, 5, 0)).toBeNull();
    expect(splitSpend(10, 5, -1)).toBeNull();
    expect(splitSpend(10, 5, 1.5)).toBeNull();
  });
});
