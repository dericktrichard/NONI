import { describe, expect, it } from "vitest";
import { peopleTerm } from "@/lib/people/term";
import { HANDLE_MAX } from "@/lib/profile/handle";

describe("peopleTerm", () => {
  it("cleans a typed handle", () => {
    expect(peopleTerm("@Aprel_Test ")).toBe("aprel_test");
    expect(peopleTerm("aprel")).toBe("aprel");
  });

  it("refuses terms that are too short, too long or not handle shaped", () => {
    for (const bad of [
      "",
      "a",
      "@a",
      "a b",
      "../x",
      "..",
      "_x",
      "x".repeat(HANDLE_MAX + 1),
    ]) {
      expect(peopleTerm(bad)).toBeNull();
    }
  });
});
