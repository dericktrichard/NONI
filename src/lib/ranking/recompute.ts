import { AP_TIERS, apIndex } from "@/config/scales";
import { applyVerifiedClaims, type FeatClaim, type ProfileInput } from "@/lib/ranking/profile";
import { evidenceShare } from "@/lib/ranking/score";
import type { FeatStatus, PowerProfile } from "@/types/domain";

export interface RecomputeInput {
  slug: string;
  name: string;
  seed: PowerProfile;
  featCount: number;
  feats: ReadonlyArray<{ claim: FeatClaim; status: FeatStatus }>;
}

export interface RecomputeResult {
  profile: PowerProfile;
  tier: string;
  tierGroup: number;
  speed: string;
  verifiedFeatCount: number;
  evidence: number;
}

function impliedDimension(attackPotency: string, durability: string): number {
  return Math.max(AP_TIERS[apIndex(attackPotency)].dimension, AP_TIERS[apIndex(durability)].dimension);
}

export function recomputeProfile(input: RecomputeInput): RecomputeResult {
  const { seed } = input;
  const base: ProfileInput = {
    slug: input.slug,
    name: input.name,
    attackPotency: seed.attackPotency,
    durability: seed.durability,
    speed: seed.speed,
    dimension: seed.dimension,
    hax: seed.hax,
    resistances: seed.resistances,
  };

  const applied = applyVerifiedClaims(base, input.feats);
  const claimed = applied.dimension ?? seed.dimension;
  const raised =
    impliedDimension(applied.attackPotency, applied.durability) > impliedDimension(seed.attackPotency, seed.durability);
  const dimension = raised
    ? Math.max(claimed, impliedDimension(applied.attackPotency, applied.durability))
    : claimed;

  const profile: PowerProfile = {
    attackPotency: applied.attackPotency,
    durability: applied.durability,
    speed: applied.speed,
    dimension,
    hax: (applied.hax ?? []).map((h) => ({ kind: h.kind, power: h.power })),
    resistances: (applied.resistances ?? []).map((r) => ({ kind: r.kind, power: r.power })),
  };
  const verifiedFeatCount = applied.verifiedFeatCount ?? 0;

  return {
    profile,
    tier: profile.attackPotency,
    tierGroup: AP_TIERS[apIndex(profile.attackPotency)].group,
    speed: profile.speed,
    verifiedFeatCount,
    evidence: evidenceShare(verifiedFeatCount, input.featCount),
  };
}