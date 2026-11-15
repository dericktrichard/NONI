import { describe, expect, it } from "vitest";
import { checkTeams } from "@/lib/battle/clash";
import { counterTeam, randomTeam } from "@/lib/battle/counter";
import { entityOf, type Entrant } from "@/lib/battle/types";
import { compileProfile } from "@/lib/ranking/profile";

const profile = (slug: string) =>
  compileProfile({
    slug,
    name: slug,
    attackPotency: "6-A",
    durability: "6-A",
    speed: "Relativistic",
  });

const entrant = (slug: string, entity?: string): Entrant => ({
  profile: profile(slug),
  verse: `verse-${slug}`,
  score: 1000,
  entity,
});

const entityBySlug = (slug: string) => (slug.startsWith("a") ? "a" : slug);

describe("team check with versions", () => {
  it("rejects two versions of one character on a team", () => {
    const issue = checkTeams(
      [profile("a"), profile("a-film")],
      [profile("b"), profile("c")],
      entityBySlug,
    );
    expect(issue).toBe("versions");
  });

  it("allows versions on opposite sides", () => {
    const issue = checkTeams(
      [profile("a"), profile("b")],
      [profile("a-film"), profile("c")],
      entityBySlug,
    );
    expect(issue).toBeNull();
  });

  it("behaves as before without an entity lookup", () => {
    expect(checkTeams([profile("a")], [profile("b")])).toBeNull();
  });
});

describe("team building with versions", () => {
  const pool = [
    entrant("a"),
    entrant("a-film", "a"),
    entrant("b"),
    entrant("c"),
    entrant("d"),
  ];

  it("never counters with two versions of one character", () => {
    const team = counterTeam(pool, [entrant("x")], "fair", {
      size: 3,
      exclude: new Set<string>(),
    });
    expect(team).not.toBeNull();
    expect(new Set(team!.map(entityOf)).size).toBe(3);
  });

  it("never builds a random team with two versions of one character", () => {
    const team = randomTeam(pool.slice(0, 4), {
      size: 3,
      exclude: new Set<string>(),
      rng: () => 0.5,
    });
    expect(team).not.toBeNull();
    expect(new Set(team!.map(entityOf)).size).toBe(3);
  });

  it("skips every version of an excluded entity", () => {
    const team = randomTeam(pool, {
      size: 2,
      exclude: new Set<string>(),
      excludeEntities: new Set(["a"]),
      rng: () => 0.5,
    });
    const slugs = team!.map((e) => e.profile.slug);
    expect(slugs).not.toContain("a");
    expect(slugs).not.toContain("a-film");
  });
});
