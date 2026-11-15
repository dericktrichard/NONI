import { describe, expect, it } from "vitest";
import { isPublished } from "@/lib/import/published";

describe("isPublished", () => {
  it("treats a character without a draft field as published", () => {
    expect(isPublished({ name: "Alpha" } as { draft?: unknown })).toBe(true);
  });

  it("refuses a draft", () => {
    expect(isPublished({ draft: true })).toBe(false);
  });

  it("ignores a draft value that is not true", () => {
    expect(isPublished({ draft: false })).toBe(true);
    expect(isPublished(undefined)).toBe(true);
  });
});
