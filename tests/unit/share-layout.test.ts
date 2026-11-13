import { describe, expect, it } from "vitest";
import { nameSize } from "@/lib/share/layout";

describe("nameSize", () => {
  it("keeps short names at the base size", () => {
    expect(nameSize("Goku", 80)).toBe(80);
  });

  it("shrinks long names in steps", () => {
    expect(nameSize("Son Goku Ultra Instinct", 80)).toBe(56);
    expect(nameSize("Saitama the Hero", 80)).toBe(68);
  });

  it("counts characters, not bytes", () => {
    expect(nameSize("ああああああああああああああ", 80)).toBe(80);
  });
});
