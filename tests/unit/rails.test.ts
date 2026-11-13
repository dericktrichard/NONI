import { describe, expect, it } from "vitest";
import { buildRails } from "@/lib/home/rails";
import type { CharacterSummary, MediaType } from "@/types/character";

function make(id: string, media: MediaType): CharacterSummary {
  return {
    id,
    name: id,
    verse: "Verse",
    media,
    tier: "5-A",
    speed: "Human",
    score: 1,
    trend: 0,
    featCount: 0,
    evidence: 0,
    imageUrl: null,
  };
}

const pool = [
  make("a1", "anime"),
  make("m1", "manga"),
  make("a2", "anime"),
  make("c1", "comic"),
  make("m2", "manga"),
  make("a3", "anime"),
];

describe("buildRails", () => {
  it("returns nothing for an empty pool", () => {
    expect(buildRails([])).toEqual([]);
  });

  it("starts with the overall rail, capped by the limit", () => {
    const rails = buildRails(pool, { limit: 4 });
    expect(rails[0]?.id).toBe("top");
    expect(rails[0]?.items.map((item) => item.position)).toEqual([1, 2, 3, 4]);
  });

  it("only builds medium rails with enough characters", () => {
    const ids = buildRails(pool).map((rail) => rail.id);
    expect(ids).toContain("media-anime");
    expect(ids).toContain("media-manga");
    expect(ids).not.toContain("media-comic");
  });

  it("orders medium rails by their best member and keeps global positions", () => {
    const rails = buildRails(pool);
    expect(rails.map((rail) => rail.id)).toEqual(["top", "media-anime", "media-manga"]);
    expect(rails[1]?.items.map((item) => item.position)).toEqual([1, 3, 6]);
    expect(rails[2]?.items.map((item) => item.position)).toEqual([2, 5]);
  });

  it("links each rail to the right ranking page", () => {
    const rails = buildRails(pool);
    expect(rails[0]?.href).toBe("/?all=1");
    expect(rails[1]?.href).toBe("/?media=anime");
    expect(rails[2]?.href).toBe("/?media=manga");
  });
});
