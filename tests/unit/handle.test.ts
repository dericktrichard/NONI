import { describe, expect, it } from "vitest";
import { checkHandle, handleCooldownDays, normalizeHandle } from "@/lib/profile/handle";

describe("normalizeHandle", () => {
  it("trims, drops a leading @ and lowercases", () => {
    expect(normalizeHandle("  @Gojo_Fan ")).toBe("gojo_fan");
  });
});

describe("checkHandle", () => {
  it("accepts ordinary handles", () => {
    expect(checkHandle("gojo_fan")).toBeNull();
    expect(checkHandle("abc")).toBeNull();
    expect(checkHandle("a1_b2_c3")).toBeNull();
  });

  it("enforces the length limits", () => {
    expect(checkHandle("ab")).toBe("length");
    expect(checkHandle("a".repeat(21))).toBe("length");
    expect(checkHandle("a".repeat(20))).toBeNull();
  });

  it("refuses odd characters and leading underscores", () => {
    expect(checkHandle("_ghost")).toBe("characters");
    expect(checkHandle("go-ku")).toBe("characters");
    expect(checkHandle("goku!")).toBe("characters");
    expect(checkHandle("Goku")).toBe("characters");
    expect(checkHandle("gokú")).toBe("characters");
  });

  it("reserves staff and system names", () => {
    expect(checkHandle("admin")).toBe("reserved");
    expect(checkHandle("moderator")).toBe("reserved");
    expect(checkHandle("noni")).toBe("reserved");
  });
});

describe("handleCooldownDays", () => {
  const now = Date.UTC(2026, 9, 29);
  const day = 86_400_000;

  it("allows a first change", () => {
    expect(handleCooldownDays(null, now)).toBe(0);
  });

  it("counts the days left, rounding up", () => {
    expect(handleCooldownDays(now - 10 * day, now)).toBe(20);
    expect(handleCooldownDays(now - 29.5 * day, now)).toBe(1);
  });

  it("allows a change after 30 days", () => {
    expect(handleCooldownDays(now - 30 * day, now)).toBe(0);
    expect(handleCooldownDays(now - 90 * day, now)).toBe(0);
  });
});