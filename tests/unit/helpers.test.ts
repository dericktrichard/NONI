import { describe, expect, it } from "vitest";
import { matchupId } from "@/lib/firebase/paths";
import { buildSearchKeys } from "@/lib/search-keys";

describe("matchupId", () => {
  it("is the same regardless of order", () => {
    expect(matchupId("saitama", "goku")).toBe("goku_vs_saitama");
    expect(matchupId("goku", "saitama")).toBe("goku_vs_saitama");
  });

  it("rejects self matchups and bad slugs", () => {
    expect(() => matchupId("goku", "goku")).toThrow();
    expect(() => matchupId("Goku", "saitama")).toThrow();
    expect(() => matchupId("go/ku", "saitama")).toThrow();
  });
});

describe("buildSearchKeys", () => {
  it("builds word prefixes", () => {
    const keys = buildSearchKeys(["Gojo Satoru"]);
    expect(keys).toContain("go");
    expect(keys).toContain("gojo");
    expect(keys).toContain("sato");
    expect(keys).not.toContain("g");
  });

  it("strips accents and punctuation", () => {
    expect(buildSearchKeys(["Pokémon"])).toContain("pokemon");
  });
});