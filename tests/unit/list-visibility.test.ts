import { describe, expect, it } from "vitest";
import { visibilityOf } from "@/lib/lists/rules";

describe("visibilityOf", () => {
  it("treats a missing value as public", () => {
    expect(visibilityOf(undefined)).toBe("public");
  });

  it("keeps private", () => {
    expect(visibilityOf("private")).toBe("private");
  });

  it("falls back to public for anything unknown", () => {
    expect(visibilityOf("hidden")).toBe("public");
    expect(visibilityOf(7)).toBe("public");
  });
});