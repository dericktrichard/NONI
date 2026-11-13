import { describe, expect, it } from "vitest";
import { nextListStatus } from "@/lib/lists/moderation";
import { withoutCharacter } from "@/lib/lists/rules";

describe("nextListStatus", () => {
  it("hides a visible list and restores a hidden one", () => {
    expect(nextListStatus("hide", "visible")).toBe("hidden");
    expect(nextListStatus("restore", "hidden")).toBe("visible");
  });

  it("allows dismiss only on visible lists", () => {
    expect(nextListStatus("dismiss", "visible")).toBe("visible");
    expect(nextListStatus("dismiss", "hidden")).toBeNull();
  });

  it("refuses actions that do not fit the state", () => {
    expect(nextListStatus("hide", "hidden")).toBeNull();
    expect(nextListStatus("restore", "visible")).toBeNull();
  });
});

describe("withoutCharacter", () => {
  it("removes only the matching entry", () => {
    const items = [{ characterId: "a" }, { characterId: "b" }, { characterId: "c" }];
    expect(withoutCharacter(items, "b")).toEqual([
      { characterId: "a" },
      { characterId: "c" },
    ]);
    expect(withoutCharacter(items, "z")).toHaveLength(3);
  });
});
