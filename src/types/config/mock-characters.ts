import { rankField } from "@/lib/ranking/field";
import { compileProfile, type ProfileInput } from "@/lib/ranking/profile";
import type { CharacterSummary, MediaType } from "@/types/character";

/**
 * DEVELOPMENT PLACEHOLDERS ONLY. The tiers, speeds and abilities below were picked to
 * give the dashboard a believable spread. They are not researched ratings. Real values
 * will come from community-verified feats (Step 7) and editor seeds (Step 6).
 */
interface MockSeed {
  profile: ProfileInput;
  verse: string;
  media: MediaType;
  featCount: number;
  /** Rank at the last snapshot, to show movement arrows */
  previousRank: number;
}

export const MOCK_SEEDS: MockSeed[] = [
  {
    profile: { slug: "saitama", name: "Saitama", attackPotency: "4-B", durability: "4-B", speed: "Massively FTL", verifiedFeatCount: 120 },
    verse: "One Punch Man", media: "manga", featCount: 142, previousRank: 2,
  },
  {
    profile: { slug: "goku", name: "Goku", attackPotency: "3-A", durability: "3-B", speed: "Massively FTL+", verifiedFeatCount: 250 },
    verse: "Dragon Ball", media: "anime", featCount: 311, previousRank: 4,
  },
  {
    profile: { slug: "superman", name: "Superman", attackPotency: "4-A", durability: "4-A", speed: "Massively FTL", verifiedFeatCount: 230 },
    verse: "DC Comics", media: "comic", featCount: 268, previousRank: 2,
  },
  {
    profile: {
      slug: "doctor-manhattan", name: "Doctor Manhattan", attackPotency: "3-A", durability: "3-A", speed: "Infinite", dimension: 4,
      hax: [{ kind: "reality-warping", power: "3-A" }, { kind: "time-manipulation", power: "3-A" }],
      resistances: [{ kind: "time-manipulation", power: "3-A" }], verifiedFeatCount: 55,
    },
    verse: "Watchmen", media: "comic", featCount: 74, previousRank: 5,
  },
  {
    profile: {
      slug: "anos-voldigoad", name: "Anos Voldigoad", attackPotency: "4-A", durability: "3-C", speed: "Massively FTL",
      hax: [{ kind: "causality-manipulation", power: "4-A" }, { kind: "conceptual-manipulation", power: "4-A" }],
      resistances: [{ kind: "causality-manipulation", power: "4-A" }], verifiedFeatCount: 58,
    },
    verse: "Misfit of Demon King Academy", media: "novel", featCount: 96, previousRank: 8,
  },
  {
    profile: { slug: "sung-jinwoo", name: "Sung Jinwoo", attackPotency: "5-A", durability: "5-A", speed: "Massively FTL", verifiedFeatCount: 85 },
    verse: "Solo Leveling", media: "manhwa", featCount: 121, previousRank: 4,
  },
  {
    profile: { slug: "xiao-yan", name: "Xiao Yan", attackPotency: "4-C", durability: "4-C", speed: "FTL+", verifiedFeatCount: 44 },
    verse: "Battle Through the Heavens", media: "donghua", featCount: 88, previousRank: 7,
  },
  {
    profile: {
      slug: "gojo-satoru", name: "Gojo Satoru", attackPotency: "5-B", durability: "5-B", speed: "Relativistic+",
      hax: [{ kind: "space-manipulation", power: "5-B" }, { kind: "dimensional-reach", power: "5-B" }],
      resistances: [{ kind: "space-manipulation", power: "5-B" }], verifiedFeatCount: 118,
    },
    verse: "Jujutsu Kaisen", media: "anime", featCount: 134, previousRank: 9,
  },
  {
    profile: { slug: "luffy", name: "Monkey D. Luffy", attackPotency: "6-A", durability: "6-A", speed: "Massively Hypersonic+", verifiedFeatCount: 166 },
    verse: "One Piece", media: "manga", featCount: 203, previousRank: 8,
  },
  {
    profile: { slug: "thor", name: "Thor", attackPotency: "5-B", durability: "5-B", speed: "Relativistic", verifiedFeatCount: 138 },
    verse: "Marvel Comics", media: "comic", featCount: 177, previousRank: 10,
  },
  {
    profile: { slug: "lin-dong", name: "Lin Dong", attackPotency: "6-B", durability: "6-B", speed: "Hypersonic+", verifiedFeatCount: 21 },
    verse: "Martial Universe", media: "manhua", featCount: 52, previousRank: 13,
  },
  {
    profile: {
      slug: "neo", name: "Neo", attackPotency: "8-A", durability: "8-A", speed: "Supersonic+",
      hax: [{ kind: "mind-manipulation", power: "8-A" }], verifiedFeatCount: 21,
    },
    verse: "The Matrix", media: "live-action", featCount: 39, previousRank: 9,
  },
];

const byId = new Map(MOCK_SEEDS.map((s) => [s.profile.slug, s]));

/** The sample roster run through the real engine, already in rank order */
export const MOCK_CHARACTERS: CharacterSummary[] = rankField(
  MOCK_SEEDS.map((s) => compileProfile(s.profile)),
).map((entry, index) => {
  const seed = byId.get(entry.slug)!;
  const verified = seed.profile.verifiedFeatCount ?? 0;
  return {
    id: entry.slug,
    name: entry.name,
    verse: seed.verse,
    media: seed.media,
    tier: seed.profile.attackPotency,
    speed: seed.profile.speed,
    score: entry.score,
    trend: seed.previousRank - (index + 1),
    featCount: seed.featCount,
    evidence: seed.featCount === 0 ? 0 : Math.min(1, verified / seed.featCount),
    imageUrl: null,
  };
});
