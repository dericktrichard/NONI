import { describe, expect, it } from "vitest";
import { GLAZE, clashReward, climbReward, dayKey, grantable, underdogFactor } from "@/lib/glaze/rules";

describe("underdogFactor", () => {
  it("pays more for long odds and less for easy ones, within bounds", () => {
    expect(underdogFactor(0.5)).toBe(1);
    expect(underdogFactor(0.25)).toBeGreaterThan(1);
    expect(underdogFactor(0.75)).toBeLessThan(1);
    expect(underdogFactor(0)).toBe(GLAZE.clash.underdogMax);
    expect(underdogFactor(1)).toBe(GLAZE.clash.underdogMin);
  });
});

describe("clashReward", () => {
  it("rewards survivors and always pays something", () => {
    expect(clashReward({ won: true, survivors: 3, edge: 0.5 })).toBeGreaterThan(clashReward({ won: true, survivors: 1, edge: 0.5 }));
    expect(clashReward({ won: false, survivors: 0, edge: 0.5 })).toBeGreaterThan(0);
    expect(clashReward({ won: true, survivors: 1, edge: 0.2 })).toBeGreaterThan(clashReward({ won: true, survivors: 1, edge: 0.8 }));
  });
});

describe("climbReward", () => {
  it("pays the champion most and hard counters more than fair", () => {
    const win = climbReward({ wins: 3, rounds: 3, mode: "counters", difficulty: "fair" });
    const out = climbReward({ wins: 1, rounds: 3, mode: "counters", difficulty: "fair" });
    expect(win).toBeGreaterThan(out);
    expect(climbReward({ wins: 2, rounds: 3, mode: "counters", difficulty: "hard" })).toBeGreaterThan(
      climbReward({ wins: 2, rounds: 3, mode: "counters", difficulty: "fair" }),
    );
    expect(climbReward({ wins: 2, rounds: 3, mode: "random", difficulty: "hard" })).toBeLessThan(
      climbReward({ wins: 2, rounds: 3, mode: "counters", difficulty: "fair" }),
    );
  });
});

describe("daily cap", () => {
  it("never grants past the cap", () => {
    expect(grantable(0, 20)).toBe(20);
    expect(grantable(GLAZE.dailyEarnCap - 5, 20)).toBe(5);
    expect(grantable(GLAZE.dailyEarnCap, 20)).toBe(0);
    expect(grantable(GLAZE.dailyEarnCap + 50, 20)).toBe(0);
  });
  it("keys days in UTC", () => {
    expect(dayKey(new Date("2026-11-08T23:59:59Z"))).toBe("2026-11-08");
  });
});