import { describe, expect, it } from "vitest";
import {
  FRAMES,
  TITLES,
  findFlair,
  isFrame,
  isTitle,
  titleLabel,
} from "@/lib/flair/rules";
import { readLook } from "@/lib/profile/look";

describe("flair catalogue", () => {
  it("never reuses an id across frames and titles", () => {
    const ids = [...FRAMES, ...TITLES].map((item) => item.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("prices every item in whole Glaze", () => {
    for (const item of [...FRAMES, ...TITLES]) {
      expect(Number.isInteger(item.price) && item.price > 0).toBe(true);
    }
  });

  it("finds an item by id", () => {
    expect(findFlair("line")).toEqual({ kind: "frame", price: 200 });
    expect(findFlair("underdog")).toEqual({ kind: "title", price: 300 });
    expect(findFlair("nope")).toBeNull();
  });

  it("guards ids and labels titles", () => {
    expect(isFrame("mark")).toBe(true);
    expect(isFrame("underdog")).toBe(false);
    expect(isTitle("underdog")).toBe(true);
    expect(isTitle(5)).toBe(false);
    expect(titleLabel("lore-keeper")).toBe("Lore keeper");
    expect(titleLabel(undefined)).toBeNull();
  });
});

describe("readLook flair", () => {
  it("reads an equipped frame and title", () => {
    expect(readLook({ frame: "mark", flairTitle: "underdog" })).toMatchObject({
      frame: "mark",
      title: "underdog",
    });
  });

  it("ignores values that are not in the catalogue", () => {
    const look = readLook({ frame: "gold", flairTitle: 5 });
    expect(look.frame).toBeUndefined();
    expect(look.title).toBeUndefined();
  });
});
