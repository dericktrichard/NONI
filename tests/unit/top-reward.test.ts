import { describe, expect, it } from "vitest";
import { TOP, topReward } from "@/lib/standing/top-reward";

describe("topReward", () => {
  it("pays nothing without a position", () => {
    expect(topReward(0)).toBe(0);
    expect(topReward(-1)).toBe(0);
  });

  it("pays the best position in full and extras at the lower rate", () => {
    expect(topReward(1)).toBe(TOP.best);
    expect(topReward(2)).toBe(TOP.best + TOP.extra);
    expect(topReward(3)).toBe(TOP.best + 2 * TOP.extra);
  });

  it("never passes the daily cap", () => {
    expect(topReward(5)).toBe(TOP.cap);
    expect(topReward(50)).toBe(TOP.cap);
  });
});
