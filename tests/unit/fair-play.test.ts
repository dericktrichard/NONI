import { describe, expect, it } from "vitest";
import {
  capNetWin,
  climbKey,
  climbReward,
  fanPoints,
  isRepeat,
  matchupKey,
  mayStake,
  practiceReward,
} from "@/lib/battle/fair-play";

describe("matchup keys", () => {
  it("ignores order and side", () => {
    expect(matchupKey(["b", "a"], ["d", "c"])).toBe(matchupKey(["c", "d"], ["a", "b"]));
  });
  it("detects repeats", () => {
    expect(isRepeat([matchupKey(["a"], ["b"])], matchupKey(["b"], ["a"]))).toBe(true);
    expect(isRepeat([matchupKey(["a"], ["b"])], matchupKey(["a"], ["c"]))).toBe(false);
    expect(climbKey("goku", 8)).not.toBe(climbKey("goku", 16));
  });
});

describe("practice", () => {
  it("pays 1 for a fresh win and nothing for a loss or repeat", () => {
    expect(practiceReward({ won: true, repeat: false, earnedToday: 0 })).toBe(1);
    expect(practiceReward({ won: false, repeat: false, earnedToday: 0 })).toBe(0);
    expect(practiceReward({ won: true, repeat: true, earnedToday: 0 })).toBe(0);
  });
  it("stops at the daily cap", () => {
    expect(practiceReward({ won: true, repeat: false, earnedToday: 10 })).toBe(0);
  });
});

describe("stakes", () => {
  it("allows two fresh staked matches a day", () => {
    expect(mayStake({ stake: 25, stakedToday: 0, repeat: false })).toBe(true);
    expect(mayStake({ stake: 25, stakedToday: 2, repeat: false })).toBe(false);
  });
  it("refuses a staked repeat but always allows free play", () => {
    expect(mayStake({ stake: 25, stakedToday: 0, repeat: true })).toBe(false);
    expect(mayStake({ stake: 0, stakedToday: 5, repeat: true })).toBe(true);
  });
  it("caps winnings but never reduces a loss", () => {
    expect(capNetWin({ delta: 80, netToday: 100 })).toBe(50);
    expect(capNetWin({ delta: 80, netToday: 150 })).toBe(0);
    expect(capNetWin({ delta: -50, netToday: 150 })).toBe(-50);
  });
});

describe("fan points", () => {
  it("caps per character per day and ignores repeats", () => {
    expect(fanPoints({ wanted: 3, earnedToday: 11, repeat: false })).toBe(1);
    expect(fanPoints({ wanted: 3, earnedToday: 0, repeat: true })).toBe(0);
  });
});

describe("tournament reward", () => {
  it("pays per round and a title bonus by bracket", () => {
    expect(
      climbReward({ wins: 2, size: 8, champion: false, repeat: false, runsToday: 0 }),
    ).toBe(2);
    expect(
      climbReward({ wins: 3, size: 8, champion: true, repeat: false, runsToday: 0 }),
    ).toBe(13);
    expect(
      climbReward({ wins: 4, size: 16, champion: true, repeat: false, runsToday: 1 }),
    ).toBe(24);
  });
  it("pays nothing for repeats or after two runs", () => {
    expect(
      climbReward({ wins: 3, size: 8, champion: true, repeat: true, runsToday: 0 }),
    ).toBe(0);
    expect(
      climbReward({ wins: 3, size: 8, champion: true, repeat: false, runsToday: 2 }),
    ).toBe(0);
  });
});
