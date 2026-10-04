import { describe, expect, it } from "vitest";
import { MOCK_CHARACTERS, MOCK_SEEDS } from "@/config/mock-characters";
import { compileProfile } from "@/lib/ranking/profile";

describe("sample roster", () => {
  it("compiles, so every tier, speed and ability name is real", () => {
    for (const seed of MOCK_SEEDS) expect(() => compileProfile(seed.profile)).not.toThrow();
  });

  it("is ranked best first with scores in range", () => {
    expect(MOCK_CHARACTERS.length).toBe(MOCK_SEEDS.length);
    for (let i = 1; i < MOCK_CHARACTERS.length; i++) {
      expect(MOCK_CHARACTERS[i - 1].score).toBeGreaterThan(MOCK_CHARACTERS[i].score - 1);
    }
    for (const c of MOCK_CHARACTERS) {
      expect(c.score).toBeGreaterThan(-1);
      expect(c.score).toBeLessThan(10001);
      expect(c.evidence).toBeLessThan(1.0001);
    }
  });
});
