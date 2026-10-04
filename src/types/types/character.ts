export type MediaType =
  | "anime"
  | "manga"
  | "comic"
  | "novel"
  | "manhwa"
  | "manhua"
  | "donghua"
  | "live-action";

/** Lightweight shape for list views. */
export interface CharacterSummary {
  id: string;
  name: string;
  verse: string;
  media: MediaType;
  /** Attack potency tier code from the power scale, such as "7-B" or "High 6-A" */
  tier: string;
  /** Speed level from the speed scale, such as "Relativistic" */
  speed: string;
  /** 0 to 10,000: mean win probability against the field, scaled */
  score: number;
  /** Places moved since the last snapshot. Positive means up. */
  trend: number;
  featCount: number;
  /** 0 to 1, share of feats that are community verified */
  evidence: number;
  imageUrl: string | null;
}
