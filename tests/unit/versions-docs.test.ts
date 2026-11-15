import { describe, expect, it } from "vitest";
import { toSummary } from "@/lib/data/summary";
import { buildCharacterDocs, type CharacterSeed } from "@/lib/ranking/character-doc";

const seed = (slug: string, extra: Partial<CharacterSeed> = {}): CharacterSeed => ({
  profile: {
    slug,
    name: slug,
    attackPotency: "6-A",
    durability: "6-A",
    speed: "Relativistic",
  },
  verse: "Test Verse",
  media: "comic",
  featCount: 0,
  ...extra,
});

describe("character versions in documents", () => {
  it("defaults the entity to the slug", () => {
    const [doc] = buildCharacterDocs([seed("alpha")]);
    expect(doc.entity).toBe("alpha");
    expect(doc.continuity).toBeNull();
  });

  it("stores the entity and continuity of a version", () => {
    const docs = buildCharacterDocs([
      seed("alpha"),
      seed("alpha-film", { entity: "alpha", media: "live-action", continuity: "DCEU" }),
    ]);
    const film = docs.find((d) => d.slug === "alpha-film");
    expect(film?.entity).toBe("alpha");
    expect(film?.continuity).toBe("DCEU");
  });

  it("rejects an entity that is not a slug", () => {
    expect(() => buildCharacterDocs([seed("alpha-b", { entity: "Not Slug" })])).toThrow(
      /Invalid entity/,
    );
  });

  it("rejects two identical versions", () => {
    expect(() =>
      buildCharacterDocs([seed("alpha"), seed("alpha-two", { entity: "alpha" })]),
    ).toThrow(/Duplicate version/);
  });

  it("allows the same entity in different media", () => {
    const docs = buildCharacterDocs([
      seed("alpha"),
      seed("alpha-film", { entity: "alpha", media: "live-action" }),
    ]);
    expect(docs).toHaveLength(2);
  });
});

describe("toSummary versions", () => {
  const base = {
    name: "Alpha",
    verseName: "Test Verse",
    media: "comic",
    tier: "6-A",
    speed: "Relativistic",
    score: 100,
    rank: 1,
  };

  it("leaves out the entity when it equals the id", () => {
    expect(toSummary("alpha", { ...base, entity: "alpha" })).not.toHaveProperty("entity");
  });

  it("includes the entity and continuity of a version", () => {
    expect(
      toSummary("alpha-film", { ...base, entity: "alpha", continuity: "DCEU" }),
    ).toMatchObject({ entity: "alpha", continuity: "DCEU" });
  });
});
