import { describe, expect, it } from "vitest";
import { isAmount, weekTotalAfter } from "@/lib/bank/rules";

describe("isAmount", () => {
  it("accepts the preset amounts", () => {
    for (const amount of [10, 50, 100, 500]) expect(isAmount(amount)).toBe(true);
  });

  it("refuses anything else", () => {
    for (const amount of [0, -10, 5, 11, 1000, 10.5])
      expect(isAmount(amount)).toBe(false);
  });
});

describe("weekTotalAfter", () => {
  it("adds to the running total in the same week", () => {
    expect(
      weekTotalAfter({ weekKey: "2026-11-09", weekTotal: 120 }, "2026-11-09", 50),
    ).toBe(170);
  });

  it("starts again in a new week", () => {
    expect(
      weekTotalAfter({ weekKey: "2026-11-02", weekTotal: 900 }, "2026-11-09", 10),
    ).toBe(10);
  });

  it("ignores missing or broken values", () => {
    expect(
      weekTotalAfter({ weekKey: undefined, weekTotal: undefined }, "2026-11-09", 10),
    ).toBe(10);
    expect(
      weekTotalAfter({ weekKey: "2026-11-09", weekTotal: "x" }, "2026-11-09", 10),
    ).toBe(10);
  });
});
