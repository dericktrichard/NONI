import { describe, expect, it } from "vitest";
import { hasDuplicates } from "@/lib/lists/rules";

describe("hasDuplicates", () => {
  it("accepts empty and unique lists", () => {
    expect(hasDuplicates([])).toBe(false);
    expect(hasDuplicates(["a", "b", "c"])).toBe(false);
  });

  it("detects a repeated id", () => {
    expect(hasDuplicates(["a", "b", "a"])).toBe(true);
  });
});