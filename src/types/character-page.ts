import type { FeatClaim } from "@/lib/ranking/profile";
import type { MediaType } from "@/types/character";
import type { FeatStatus, PowerProfile, Proof } from "@/types/domain";

export interface CharacterView {
  id: string;
  name: string;
  aliases: string[];
  verse: string;
  verseId: string;
  media: MediaType;
  tags: string[];
  imageUrl: string | null;
  imageCredit: string | null;
  tier: string;
  speed: string;
  score: number;
  rank: number | null;
  featCount: number;
  verifiedFeatCount: number;
  evidence: number;
  profile: PowerProfile;
}

export interface FeatView {
  id: string;
  title: string;
  description: string;
  claim: FeatClaim;
  proofs: Proof[];
  status: FeatStatus;
  upvotes: number;
  downvotes: number;
  authorName: string;
  createdAt: string;
}

export interface CharacterPageData {
  character: CharacterView;
  feats: FeatView[];
}