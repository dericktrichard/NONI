import { describe, expect, it } from "vitest";
import { checkCitationScope, checkCitedFeats } from "@/lib/matchup/arguments";

const pair = ["gojo-satoru", "goku"] as const;
const feat = (characterId: string, featId: string) => ({ characterId, featId });

describe("checkCitationScope", () => {
  it("accepts feats from either character in the matchup", () => {
    expect(checkCitationScope([feat("goku", "a1"), feat("gojo-satoru", "b1")], pair)).toBeNull();
  });

  it("refuses feats from a third character", () => {
    expect(checkCitationScope([feat("naruto", "a1")], pair)).toBe("wrong_character");
  });

  it("refuses the same feat cited twice", () => {
    expect(checkCitationScope([feat("goku", "a1"), feat("goku", "a1")], pair)).toBe("duplicate");
  });

  it("allows the same feat id under different characters", () => {
    expect(checkCitationScope([feat("goku", "a1"), feat("gojo-satoru", "a1")], pair)).toBeNull();
  });
});

describe("checkCitedFeats", () => {
  it("accepts verified feats only", () => {
    expect(checkCitedFeats([{ exists: true, status: "verified" }])).toBeNull();
    expect(checkCitedFeats([{ exists: true, status: "pending" }])).toBe("unverified");
    expect(checkCitedFeats([{ exists: true, status: "rejected" }])).toBe("unverified");
  });

  it("reports a missing feat before anything else", () => {
    expect(checkCitedFeats([{ exists: false }, { exists: true, status: "pending" }])).toBe("missing");
  });
});