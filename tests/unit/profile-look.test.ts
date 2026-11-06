import { describe, expect, it } from "vitest";
import { DEFAULT_THEME, readLook } from "@/lib/profile/look";

describe("readLook", () => {
  it("returns defaults for an empty document", () => {
    expect(readLook({})).toEqual({
      avatarId: null,
      avatarName: null,
      avatarUrl: null,
      bannerTheme: DEFAULT_THEME,
      bannerId: null,
      bannerUrl: null,
    });
  });

  it("keeps valid values", () => {
    const look = readLook({
      avatarId: "alpha",
      avatarName: "Alpha",
      avatarUrl: "https://img.test/a.webp",
      bannerTheme: "ink",
      bannerId: "beta",
      bannerUrl: "https://img.test/b.webp",
    });
    expect(look.avatarId).toBe("alpha");
    expect(look.bannerTheme).toBe("ink");
    expect(look.bannerUrl).toBe("https://img.test/b.webp");
  });

  it("falls back from an unknown theme", () => {
    expect(readLook({ bannerTheme: "neon" }).bannerTheme).toBe(DEFAULT_THEME);
  });

  it("drops images that are not https", () => {
    const look = readLook({ avatarUrl: "http://img.test/a.webp", bannerUrl: "javascript:alert(1)" });
    expect(look.avatarUrl).toBeNull();
    expect(look.bannerUrl).toBeNull();
  });
});