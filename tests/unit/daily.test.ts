import { describe, expect, it } from "vitest";
import { dailyPair, dayNumber, pickPair } from "@/lib/matchup/daily";

describe("dayNumber", () => {
  it("counts whole UTC days", () => {
    expect(dayNumber(new Date(Date.UTC(1970, 0, 2)))).toBe(1);
    expect(dayNumber(new Date(Date.UTC(1970, 0, 2, 23, 59)))).toBe(1);
    expect(dayNumber(new Date(Date.UTC(1970, 0, 3)))).toBe(2);
  });
});

describe("dailyPair", () => {
  it("needs at least two characters", () => {
    expect(dailyPair(0, 100)).toBeNull();
    expect(dailyPair(1, 100)).toBeNull();
  });

  it("always returns two different valid indexes", () => {
    for (let count = 2; count <= 20; count++) {
      for (let day = 20_000; day < 20_500; day++) {
        const pair = dailyPair(count, day);
        expect(pair).not.toBeNull();
        const [a, b] = pair!;
        expect(a).not.toBe(b);
        expect(a).toBeGreaterThanOrEqual(0);
        expect(b).toBeGreaterThanOrEqual(0);
        expect(a).toBeLessThan(count);
        expect(b).toBeLessThan(count);
      }
    }
  });

  it("is stable within a day and changes between days", () => {
    expect(dailyPair(12, 20_500)).toEqual(dailyPair(12, 20_500));
    expect(dailyPair(12, 20_500)).not.toEqual(dailyPair(12, 20_501));
  });
});

describe("pickPair", () => {
  it("returns two different items from the first poolSize", () => {
    const items = Array.from({ length: 30 }, (_, i) => i);
    for (let day = 20_000; day < 20_100; day++) {
      const pair = pickPair(items, day, 12);
      expect(pair).not.toBeNull();
      expect(pair![0]).not.toBe(pair![1]);
      expect(pair![0]).toBeLessThan(12);
      expect(pair![1]).toBeLessThan(12);
    }
  });

  it("returns null with fewer than two items", () => {
    expect(pickPair([], 20_000)).toBeNull();
    expect(pickPair(["only"], 20_000)).toBeNull();
  });
});