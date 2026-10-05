import { describe, expect, it } from "vitest";
import { slugify } from "@/lib/slug";
import { SLUG_RE } from "@/lib/firebase/paths";

describe("slugify", () => {
  it("lowercases and joins words with single hyphens", () => {
    expect(slugify("Gojo Satoru")).toBe("gojo-satoru");
    expect(slugify("Dragon   Ball")).toBe("dragon-ball");
    expect(slugify("  Monkey D. Luffy ")).toBe("monkey-d-luffy");
  });

  it("strips accents and punctuation", () => {
    expect(slugify("Pokémon")).toBe("pokemon");
    expect(slugify("Misfit of Demon King Academy!")).toBe("misfit-of-demon-king-academy");
  });

  it("returns an empty string when nothing is usable", () => {
    expect(slugify("!!!")).toBe("");
    expect(slugify("")).toBe("");
  });

  it("always produces a valid slug or nothing", () => {
    for (const input of ["A  b", "x--y", "-lead", "trail-", "9 Lives", "Ünï Cödé"]) {
      const slug = slugify(input);
      expect(slug === "" || SLUG_RE.test(slug)).toBe(true);
    }
  });
});
