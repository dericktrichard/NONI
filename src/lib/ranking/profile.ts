import { HAX_KINDS, isHaxKind, type HaxKind } from "@/config/combat";
import {
  AP_TIERS,
  MAX_DIMENSION,
  MIN_DIMENSION,
  SPEED_LEVELS,
  apIndex,
  isApTier,
  isSpeedLevel,
  speedIndex,
} from "@/config/scales";
import type { FeatStatus } from "@/types/domain";

/** An ability and the attack potency tier it operates at */
export interface HaxClaim {
  kind: HaxKind;
  /** An attack potency tier id, such as "7-A" */
  power: string;
}

/** Human-friendly shape: scale ids as strings. This is what gets stored and edited. */
export interface ProfileInput {
  slug: string;
  name: string;
  attackPotency: string;
  durability: string;
  speed: string;
  /** Defaults to what the attack potency and durability tiers imply */
  dimension?: number;
  hax?: HaxClaim[];
  resistances?: HaxClaim[];
  verifiedFeatCount?: number;
}

/** Compiled shape: scale positions as numbers, validated. This is what the resolver uses. */
export interface CombatProfile {
  slug: string;
  name: string;
  ap: number;
  durability: number;
  speed: number;
  dimension: number;
  hax: Array<{ kind: HaxKind; power: number }>;
  resistances: Array<{ kind: HaxKind; power: number }>;
  verifiedFeatCount: number;
}

function compileClaims(claims: HaxClaim[] | undefined, slug: string) {
  const best = new Map<HaxKind, number>();
  for (const claim of claims ?? []) {
    if (!isHaxKind(claim.kind)) throw new Error(`${slug}: unknown ability kind ${claim.kind}`);
    const power = apIndex(claim.power);
    best.set(claim.kind, Math.max(best.get(claim.kind) ?? 0, power));
  }
  // Sorted so the output never depends on input order
  return [...best].sort(([a], [b]) => (a < b ? -1 : 1)).map(([kind, power]) => ({ kind, power }));
}

export function compileProfile(input: ProfileInput): CombatProfile {
  const ap = apIndex(input.attackPotency);
  const durability = apIndex(input.durability);

  const implied = Math.max(AP_TIERS[ap].dimension, AP_TIERS[durability].dimension);
  const dimension = input.dimension ?? implied;
  if (!Number.isInteger(dimension) || dimension < MIN_DIMENSION || dimension > MAX_DIMENSION) {
    throw new Error(`${input.slug}: dimension must be a whole number from ${MIN_DIMENSION} to ${MAX_DIMENSION}`);
  }

  return {
    slug: input.slug,
    name: input.name,
    ap,
    durability,
    speed: speedIndex(input.speed),
    dimension,
    hax: compileClaims(input.hax, input.slug),
    resistances: compileClaims(input.resistances, input.slug),
    verifiedFeatCount: Math.max(0, input.verifiedFeatCount ?? 0),
  };
}

/** What a feat asserts. Exactly one shape per category, so a feat cannot claim two things. */
export type FeatClaim =
  | { category: "attackPotency"; tier: string }
  | { category: "durability"; tier: string }
  | { category: "speed"; level: string }
  | { category: "dimension"; dimension: number }
  | { category: "hax"; kind: HaxKind; power: string }
  | { category: "resistance"; kind: HaxKind; power: string };

/** Whether a claim refers only to things that exist on our scales. Used by the server before storing a feat. */
export function isValidClaim(claim: FeatClaim): boolean {
  switch (claim.category) {
    case "attackPotency":
    case "durability":
      return isApTier(claim.tier);
    case "speed":
      return isSpeedLevel(claim.level);
    case "dimension":
      return (
        Number.isInteger(claim.dimension) &&
        claim.dimension >= MIN_DIMENSION &&
        claim.dimension <= MAX_DIMENSION
      );
    case "hax":
    case "resistance":
      return claim.kind in HAX_KINDS && isApTier(claim.power);
  }
}

/**
 * Builds a character's working profile from a seeded baseline plus community feats.
 *
 * Only verified feats count. For each ordinal category (attack potency, durability,
 * speed, dimension) the highest verified claim replaces the seed. Abilities and
 * resistances are replaced per kind. Anything with no verified feat keeps its seed.
 */
export function applyVerifiedClaims(
  seed: ProfileInput,
  feats: ReadonlyArray<{ claim: FeatClaim; status: FeatStatus }>,
): ProfileInput {
  let attackPotency: number | undefined;
  let durability: number | undefined;
  let speed: number | undefined;
  let dimension: number | undefined;
  const hax = new Map<HaxKind, number>();
  const resistances = new Map<HaxKind, number>();

  const raise = (current: number | undefined, next: number) =>
    current === undefined || next > current ? next : current;

  let verified = 0;
  for (const { claim, status } of feats) {
    if (status !== "verified" || !isValidClaim(claim)) continue;
    verified += 1;

    switch (claim.category) {
      case "attackPotency":
        attackPotency = raise(attackPotency, apIndex(claim.tier));
        break;
      case "durability":
        durability = raise(durability, apIndex(claim.tier));
        break;
      case "speed":
        speed = raise(speed, speedIndex(claim.level));
        break;
      case "dimension":
        dimension = raise(dimension, claim.dimension);
        break;
      case "hax":
        hax.set(claim.kind, raise(hax.get(claim.kind), apIndex(claim.power)));
        break;
      case "resistance":
        resistances.set(claim.kind, raise(resistances.get(claim.kind), apIndex(claim.power)));
        break;
    }
  }

  const merge = (base: HaxClaim[] | undefined, verifiedClaims: Map<HaxKind, number>): HaxClaim[] => {
    const merged = new Map<HaxKind, string>();
    for (const claim of base ?? []) merged.set(claim.kind, claim.power);
    for (const [kind, power] of verifiedClaims) merged.set(kind, AP_TIERS[power].id);
    return [...merged].map(([kind, power]) => ({ kind, power }));
  };

  return {
    ...seed,
    attackPotency: attackPotency === undefined ? seed.attackPotency : AP_TIERS[attackPotency].id,
    durability: durability === undefined ? seed.durability : AP_TIERS[durability].id,
    speed: speed === undefined ? seed.speed : SPEED_LEVELS[speed],
    dimension: dimension ?? seed.dimension,
    hax: merge(seed.hax, hax),
    resistances: merge(seed.resistances, resistances),
    verifiedFeatCount: verified,
  };
}
