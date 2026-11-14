import { describe, expect, it } from "vitest";
import { reachedTier, takeover } from "@/lib/notices/rules";

describe("takeover", () => {
  it("takes an empty board once past the minimum", () => {
    expect(takeover("me", null, 5, 5)).toEqual({ gained: true, overtaken: null });
    expect(takeover("me", null, 4, 5)).toEqual({ gained: false, overtaken: null });
  });

  it("names the player who was passed", () => {
    expect(takeover("me", { uid: "them", value: 10 }, 11)).toEqual({
      gained: true,
      overtaken: "them",
    });
  });

  it("does not count a tie", () => {
    expect(takeover("me", { uid: "them", value: 10 }, 10).gained).toBe(false);
  });

  it("does nothing when already first", () => {
    expect(takeover("me", { uid: "me", value: 10 }, 20).gained).toBe(false);
  });

  it("does nothing below the minimum even when passing", () => {
    expect(takeover("me", { uid: "them", value: 1 }, 2, 5).gained).toBe(false);
  });
});

describe("reachedTier", () => {
  it("returns the new tier when a threshold is crossed", () => {
    expect(reachedTier(4, 5)).toBe("Fan");
    expect(reachedTier(24, 25)).toBe("Devotee");
  });

  it("returns null when the tier is unchanged", () => {
    expect(reachedTier(5, 6)).toBeNull();
    expect(reachedTier(0, 3)).toBeNull();
  });
});
