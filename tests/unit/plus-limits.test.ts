import { describe, expect, it } from "vitest";
import {
  EMPTY_DAILY,
  climbReward,
  limitsFor,
  mayStake,
  practiceReward,
  todayFor,
  todayOf,
} from "@/lib/battle/fair-play";

describe("Plus limits", () => {
  it("raises the daily numbers", () => {
    expect(limitsFor(false)).toEqual({ practiceCap: 10, stakesPerDay: 2, climbRuns: 2 });
    expect(limitsFor(true)).toEqual({ practiceCap: 15, stakesPerDay: 3, climbRuns: 3 });
  });

  it("lets Plus stake a third match", () => {
    expect(mayStake({ stake: 10, stakedToday: 2, repeat: false })).toBe(false);
    expect(mayStake({ stake: 10, stakedToday: 2, repeat: false, plus: true })).toBe(true);
    expect(mayStake({ stake: 10, stakedToday: 3, repeat: false, plus: true })).toBe(
      false,
    );
  });

  it("pays practice wins up to the Plus cap", () => {
    expect(practiceReward({ won: true, repeat: false, earnedToday: 12 })).toBe(0);
    expect(
      practiceReward({ won: true, repeat: false, earnedToday: 12, plus: true }),
    ).toBe(1);
    expect(
      practiceReward({ won: true, repeat: false, earnedToday: 15, plus: true }),
    ).toBe(0);
  });

  it("allows a third rewarded tournament run for Plus", () => {
    const run = { wins: 2, size: 8, champion: false, repeat: false, runsToday: 2 };
    expect(climbReward(run)).toBe(0);
    expect(climbReward({ ...run, plus: true })).toBe(2);
  });

  it("reports what is left and the limits in force", () => {
    expect(todayOf({ ...EMPTY_DAILY, staked: 2 }, true).stakesLeft).toBe(1);
    expect(todayFor(EMPTY_DAILY, true)).toMatchObject({
      plus: true,
      stakesLeft: 3,
      climbRunsLeft: 3,
      limits: { stakesPerDay: 3 },
    });
    expect(todayFor(EMPTY_DAILY, false).limits?.stakesPerDay).toBe(2);
  });
});
