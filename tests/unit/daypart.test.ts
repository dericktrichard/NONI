import { describe, expect, it } from "vitest";
import { daypartOf } from "@/lib/home/daypart";

describe("daypartOf", () => {
  it("splits the day into morning, afternoon and night", () => {
    const table: [number, number][] = [
      [0, 2],
      [4, 2],
      [5, 0],
      [11, 0],
      [12, 1],
      [17, 1],
      [18, 2],
      [23, 2],
    ];
    for (const [hour, expected] of table) expect(daypartOf(hour)).toBe(expected);
  });
});
