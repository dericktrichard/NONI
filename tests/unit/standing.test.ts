import { describe, expect, it } from "vitest";
import { fanPoints, fanTitle, rankRows, tierOf, weekKey } from "@/lib/standing/rules";

describe("fan points", () => {
  it("counts a tournament fighter more than a team slot, once per character", () => {
    expect(fanPoints("climb", ["a"])).toEqual({ a: 3 });
    expect(fanPoints("clash", ["a", "b", "a"])).toEqual({ a: 1, b: 1 });
  });
});

describe("tiers and titles", () => {
  it("steps through the tiers at fixed scores", () => {
    expect([4, 5, 25, 100, 500].map(tierOf)).toEqual([null, "Fan", "Devotee", "Superfan", "Superfan"]);
  });
  it("titles only the top three", () => {
    expect(fanTitle("Gojo", 1)).toBe("Gojo's no. 1 fan");
    expect(fanTitle("Gojo", 3)).toBe("No. 3 fan of Gojo");
    expect(fanTitle("Gojo", 4)).toBeNull();
  });
});

describe("weekKey", () => {
  it("is the Monday of the UTC week", () => {
    expect(weekKey(new Date("2026-11-09T00:00:00Z"))).toBe("2026-11-09");
    expect(weekKey(new Date("2026-11-15T23:59:59Z"))).toBe("2026-11-09");
    expect(weekKey(new Date("2026-11-16T00:00:00Z"))).toBe("2026-11-16");
  });
});

describe("rankRows", () => {
  it("shares ranks on equal scores and orders ties by key", () => {
    const rows = rankRows([{ h: "b", s: 5 }, { h: "a", s: 5 }, { h: "c", s: 9 }, { h: "d", s: 1 }], (x) => x.s, (x) => x.h);
    expect(rows.map((x) => `${x.h}${x.rank}`)).toEqual(["c1", "a2", "b2", "d4"]);
  });
});