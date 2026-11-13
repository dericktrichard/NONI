import { describe, expect, it } from "vitest";
import { fanGrant } from "@/lib/battle/fair-play";

describe("fanGrant", () => {
  it("gives one point per team slot in a clash", () => {
    expect(fanGrant("clash", ["a", "b"], {})).toEqual({ a: 1, b: 1 });
  });

  it("gives the hero three points in a climb", () => {
    expect(fanGrant("climb", ["h"], {})).toEqual({ h: 3 });
  });

  it("trims a grant that would pass the daily cap", () => {
    expect(fanGrant("climb", ["h"], { h: 11 })).toEqual({ h: 1 });
  });

  it("grants nothing once the cap is reached", () => {
    expect(fanGrant("climb", ["h"], { h: 12 })).toEqual({ h: 0 });
  });
});
