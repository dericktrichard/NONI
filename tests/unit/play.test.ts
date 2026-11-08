import { describe, expect, it } from "vitest";
import { buildDaily, isCorrect, mulberry32, pickRight, type PlayCharacter } from "@/lib/play/game";
import {
  EMPTY_STATS,
  afterDaily,
  afterEndless,
  liveDailyStreak,
  parseStats,
  previousDay,
} from "@/lib/play/stats";

const pool = (size: number): PlayCharacter[] =>
  Array.from({ length: size }, (_, i) => ({
    id: `c${String(i).padStart(2, "0")}`,
    name: `C${i}`,
    verse: "V",
    tier: "7-B",
    score: 1000 + i * 37,
    imageUrl: null,
  }));

const ids = (day: string) => buildDaily(pool(30), day).map((d) => `${d.left.id}>${d.right.id}`).join(",");

describe("buildDaily", () => {
  it("gives the same puzzle for the same day", () => {
    expect(ids("2026-11-07")).toBe(ids("2026-11-07"));
  });

  it("gives a different puzzle on another day", () => {
    expect(ids("2026-11-07")).not.toBe(ids("2026-11-08"));
  });

  it("chains duels and never pairs equal scores", () => {
    const duels = buildDaily(pool(30), "2026-11-07");
    expect(duels).toHaveLength(10);
    duels.forEach((duel, index) => {
      expect(duel.left.score).not.toBe(duel.right.score);
      if (index > 0) expect(duel.left.id).toBe(duels[index - 1]!.right.id);
    });
  });

  it("returns fewer duels when the pool is small", () => {
    expect(buildDaily(pool(4), "2026-11-07")).toHaveLength(3);
  });
});

describe("isCorrect", () => {
  const [low, high] = pool(2) as [PlayCharacter, PlayCharacter];

  it("judges higher and lower", () => {
    expect(isCorrect({ left: low, right: high }, "higher")).toBe(true);
    expect(isCorrect({ left: low, right: high }, "lower")).toBe(false);
    expect(isCorrect({ left: high, right: low }, "lower")).toBe(true);
  });
});

describe("pickRight", () => {
  const make = (id: string, score: number): PlayCharacter => ({ id, name: id, verse: "V", tier: "7-B", score, imageUrl: null });

  it("skips the same character and equal scores", () => {
    const list = [make("a", 100), make("b", 100), make("c", 200)];
    expect(pickRight(list, list[0]!, () => 0)?.id).toBe("c");
  });

  it("returns null when nothing differs", () => {
    const list = [make("a", 100), make("b", 100)];
    expect(pickRight(list, list[0]!, () => 0)).toBeNull();
  });
});

describe("mulberry32", () => {
  it("repeats for a seed and stays in range", () => {
    const first = mulberry32(42);
    const second = mulberry32(42);
    for (let i = 0; i < 20; i += 1) {
      const value = first();
      expect(value).toBe(second());
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });
});

describe("previousDay", () => {
  it("crosses month and year boundaries", () => {
    expect(previousDay("2026-03-01")).toBe("2026-02-28");
    expect(previousDay("2026-01-01")).toBe("2025-12-31");
  });
});

describe("afterDaily", () => {
  const answers = [true, false];

  it("starts a streak on the first play", () => {
    expect(afterDaily(EMPTY_STATS, "2026-11-07", answers, "2026-11-06").dailyStreak).toBe(1);
  });

  it("extends the streak on consecutive days", () => {
    const stats = { ...EMPTY_STATS, dailyStreak: 3, lastDay: "2026-11-06" };
    expect(afterDaily(stats, "2026-11-07", answers, "2026-11-06").dailyStreak).toBe(4);
  });

  it("resets the streak after a gap", () => {
    const stats = { ...EMPTY_STATS, dailyStreak: 5, lastDay: "2026-11-01" };
    expect(afterDaily(stats, "2026-11-07", answers, "2026-11-06").dailyStreak).toBe(1);
  });

  it("ignores a second result on the same day", () => {
    const stats = afterDaily(EMPTY_STATS, "2026-11-07", answers, "2026-11-06");
    expect(afterDaily(stats, "2026-11-07", [true], "2026-11-06")).toBe(stats);
  });
});

describe("afterEndless", () => {
  it("only raises the best streak", () => {
    const stats = afterEndless(EMPTY_STATS, 4);
    expect(stats.bestStreak).toBe(4);
    expect(afterEndless(stats, 2)).toBe(stats);
  });
});

describe("parseStats", () => {
  it("returns empty stats for nothing or garbage", () => {
    expect(parseStats(null)).toEqual(EMPTY_STATS);
    expect(parseStats("{nope")).toEqual(EMPTY_STATS);
    expect(parseStats("null")).toEqual(EMPTY_STATS);
  });

  it("round-trips valid stats", () => {
    const stats = { bestStreak: 6, dailyStreak: 2, lastDay: "2026-11-07", daily: { day: "2026-11-07", answers: [true, false] } };
    expect(parseStats(JSON.stringify(stats))).toEqual(stats);
  });

  it("rejects bad values", () => {
    const parsed = parseStats(JSON.stringify({ bestStreak: -3, dailyStreak: "x", lastDay: "today", daily: { day: "x", answers: [1] } }));
    expect(parsed).toEqual(EMPTY_STATS);
  });
});

describe("liveDailyStreak", () => {
  it("only counts a streak played today or yesterday", () => {
    const stats = { ...EMPTY_STATS, dailyStreak: 4, lastDay: "2026-11-06" };
    expect(liveDailyStreak(stats, "2026-11-07", "2026-11-06")).toBe(4);
    expect(liveDailyStreak(stats, "2026-11-09", "2026-11-08")).toBe(0);
  });
});