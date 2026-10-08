import { describe, expect, it } from "vitest";
import { hasHiddenChars } from "@/lib/validation/text";

describe("hasHiddenChars", () => {
  it("accepts ordinary text, accents and newlines", () => {
    expect(hasHiddenChars("Gojo cut the ocean in half")).toBe(false);
    expect(hasHiddenChars("Pokémon and 悟空")).toBe(false);
    expect(hasHiddenChars("line one\nline two")).toBe(false);
  });

  it("rejects control characters", () => {
    expect(hasHiddenChars("a\u0000b")).toBe(true);
    expect(hasHiddenChars("a\tb")).toBe(true);
    expect(hasHiddenChars("a\u007fb")).toBe(true);
  });

  it("rejects zero width and direction override characters", () => {
    for (const char of ["\u200b", "\u200e", "\u202e", "\u2066", "\ufeff"]) {
      expect(hasHiddenChars(`a${char}b`)).toBe(true);
    }
  });
});