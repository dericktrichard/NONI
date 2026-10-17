import { HAX_KINDS, type HaxKind } from "@/config/combat";
import { AP_TIERS, MAX_DIMENSION, MIN_DIMENSION, dimensionLabel } from "@/config/scales";
import { isValidClaim, type FeatClaim } from "@/lib/ranking/profile";
import type { ProofType } from "@/types/domain";

export type Category = FeatClaim["category"];

export const CATEGORY_LABELS: Record<Category, string> = {
  attackPotency: "Attack potency",
  durability: "Durability",
  speed: "Speed",
  dimension: "Dimensionality",
  hax: "Ability",
  resistance: "Resistance",
};

export const PROOF_TYPE_LABELS: Record<ProofType, string> = {
  panel: "Panel or page",
  video: "Video",
  quote: "Quote",
  official: "Official source",
};

export function tierText(id: string): string {
  const tier = AP_TIERS.find((t) => t.id === id);
  return tier ? `${tier.id} ${tier.label}` : id;
}

export function kindText(kind: string): string {
  return Object.hasOwn(HAX_KINDS, kind) ? HAX_KINDS[kind as HaxKind].label : kind;
}

export function claimLabel(claim: FeatClaim): string {
  switch (claim.category) {
    case "attackPotency":
    case "durability":
      return `${CATEGORY_LABELS[claim.category]}: ${tierText(claim.tier)}`;
    case "speed":
      return `Speed: ${claim.level}`;
    case "dimension":
      return `Dimensionality: ${dimensionLabel(claim.dimension)}`;
    case "hax":
    case "resistance":
      return `${CATEGORY_LABELS[claim.category]}: ${kindText(claim.kind)}, ${tierText(claim.power)}`;
  }
}

export interface ClaimFields {
  category: Category;
  tier: string;
  level: string;
  dimension: number;
  kind: HaxKind | "";
  power: string;
}

export function buildClaim(f: ClaimFields): FeatClaim | null {
  let claim: FeatClaim;
  switch (f.category) {
    case "attackPotency":
      claim = { category: "attackPotency", tier: f.tier };
      break;
    case "durability":
      claim = { category: "durability", tier: f.tier };
      break;
    case "speed":
      claim = { category: "speed", level: f.level };
      break;
    case "dimension":
      if (f.dimension < MIN_DIMENSION || f.dimension > MAX_DIMENSION) return null;
      claim = { category: "dimension", dimension: f.dimension };
      break;
    case "hax":
    case "resistance":
      if (f.kind === "") return null;
      claim = { category: f.category, kind: f.kind, power: f.power };
      break;
  }
  return isValidClaim(claim) ? claim : null;
}