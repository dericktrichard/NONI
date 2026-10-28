import type { HaxClaim } from "@/lib/ranking/profile";
import type { MediaType } from "@/types/character";

export interface CharacterEditData {
  slug: string;
  name: string;
  verse: string;
  media: MediaType;
  aliases: string[];
  tags: string[];
  attackPotency: string;
  durability: string;
  speed: string;
  /** 0 means automatic from the tiers */
  dimension: number;
  hax: HaxClaim[];
  resistances: HaxClaim[];
  imageUrl: string | null;
  imageCredit: string | null;
}

export interface CharacterListItem {
  slug: string;
  name: string;
  verse: string;
  rank: number | null;
  tier: string;
  featCount: number;
  verifiedFeatCount: number;
}