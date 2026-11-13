import { describe, expect, it } from "vitest";
import { EMPTY_DAILY, todayOf } from "@/lib/battle/fair-play";

describe("today", () => {
  it("starts fresh", () => {
    expect(todayOf(EMPTY_DAILY)).toEqual({
      matchmade: false,
      stakesLeft: 2,
      practiceLeft: 10,
      winsLeft: 150,
      climbRunsLeft: 2,
    });
  });

  it("counts down and never goes negative", () => {
    const today = todayOf({
      ...EMPTY_DAILY,
      matches: 3,
      staked: 5,
      net: 200,
      practice: 12,
      climbRuns: 4,
    });
    expect(today).toEqual({
      matchmade: true,
      stakesLeft: 0,
      practiceLeft: 0,
      winsLeft: 0,
      climbRunsLeft: 0,
    });
  });
});
