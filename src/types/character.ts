export type Tier = "S+" | "S" | "A" | "B" | "C";

export type MediaType =
  | "anime"
  | "manga"
  | "comic"
  | "novel"
  | "manhwa"
  | "manhua"
  | "donghua"
  | "live-action";

/** Lightweight shape for list views. The full profile type arrives in Step 4. */
export interface CharacterSummary {
  id: string;
  name: string;
  verse: string;
  media: MediaType;
  tier: Tier;
  score: number;
  /** Places moved since the last snapshot. Positive means up. */
  trend: number;
  featCount: number;
  /** 0 to 1, share of feats that are community verified */
  evidence: number;
  imageUrl: string | null;
}