import { AP_TIERS } from "@/config/scales";
import { slugify } from "@/lib/slug";
import { buildSearchKeys } from "@/lib/search-keys";
import type { CharacterDoc, PowerProfile } from "@/types/domain";
import type { MediaType } from "@/types/character";
import { rankField } from "./field";
import { compileProfile, type ProfileInput } from "./profile";
import { evidenceShare } from "./score";

export interface CharacterSeed {
  profile: ProfileInput;
  verse: string;
  media: MediaType;
  featCount: number;
  /** Rank at the last snapshot, so the first load can show movement */
  previousRank?: number | null;
  aliases?: string[];
  tags?: string[];
}

/** A character document without server-assigned timestamps */
export type CharacterDocData = Omit<CharacterDoc, "createdAt" | "updatedAt">;

function powerProfile(input: ProfileInput, dimension: number): PowerProfile {
  return {
    attackPotency: input.attackPotency,
    durability: input.durability,
    speed: input.speed,
    dimension,
    hax: (input.hax ?? []).map((h) => ({ kind: h.kind, power: h.power })),
    resistances: (input.resistances ?? []).map((r) => ({ kind: r.kind, power: r.power })),
  };
}

/**
 * Runs the whole roster through the ranking engine and returns ready-to-store
 * documents in rank order. Pure: no clock, no database. The caller adds timestamps.
 */
export function buildCharacterDocs(seeds: readonly CharacterSeed[]): CharacterDocData[] {
  const bySlug = new Map<string, CharacterSeed>();
  for (const seed of seeds) {
    const slug = seed.profile.slug;
    if (!slugify(slug) || slugify(slug) !== slug) throw new Error(`Invalid character slug: ${slug}`);
    if (bySlug.has(slug)) throw new Error(`Duplicate character slug: ${slug}`);
    bySlug.set(slug, seed);
  }

  const compiled = seeds.map((seed) => compileProfile(seed.profile));
  const dimensions = new Map(compiled.map((p) => [p.slug, p.dimension]));
  const apIndexBySlug = new Map(compiled.map((p) => [p.slug, p.ap]));

  return rankField(compiled).map((entry, index) => {
    const seed = bySlug.get(entry.slug)!;
    const input = seed.profile;
    const dimension = dimensions.get(entry.slug)!;
    const verified = input.verifiedFeatCount ?? 0;
    const aliases = seed.aliases ?? [];

    return {
      slug: entry.slug,
      name: input.name,
      aliases,
      searchKeys: buildSearchKeys([input.name, ...aliases, seed.verse]),
      verseId: slugify(seed.verse),
      verseName: seed.verse,
      media: seed.media,
      tags: seed.tags ?? [],
      seed: powerProfile(input, dimension),
      profile: powerProfile(input, dimension),
      tier: input.attackPotency,
      tierGroup: AP_TIERS[apIndexBySlug.get(entry.slug)!].group,
      speed: input.speed,
      score: entry.score,
      winRate: entry.winRate,
      wins: entry.wins,
      losses: entry.losses,
      rank: index + 1,
      previousRank: seed.previousRank ?? null,
      featCount: seed.featCount,
      verifiedFeatCount: verified,
      evidence: evidenceShare(verified, seed.featCount),
      imageUrl: null,
      imageCredit: null,
    };
  });
}
