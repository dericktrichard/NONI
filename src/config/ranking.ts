import type { StatKey } from "@/config/stats";
import type { Tier } from "@/types/character";

/** Integer weights that sum to 100, so raw power lands on 0 to 10,000 */
export const STAT_WEIGHTS: Record<StatKey, number> = {
  attackPotency: 30,
  speed: 20,
  durability: 20,
  reach: 10,
  intelligence: 10,
  stamina: 10,
};

export const SCORE_MAX = 10_000;

/** Evidence factor: COVERAGE_FLOOR with no verified feats, 1.0 at COVERAGE_FULL_AT or more */
export const COVERAGE_FLOOR = 0.8;
export const COVERAGE_FULL_AT = 8;

/** Checked in order, first match wins */
export const TIER_CUTOFFS: ReadonlyArray<readonly [Tier, number]> = [
  ["S+", 9500],
  ["S", 9000],
  ["A", 8000],
  ["B", 6500],
];
export const LOWEST_TIER: Tier = "C";

export const VERIFICATION = {
  minUpvotes: 5,
  verifyRatio: 0.75,
  /** Lower than verifyRatio on purpose, so a verified feat does not flap */
  keepVerifiedRatio: 0.6,
  minDownvotes: 5,
  rejectRatio: 0.25,
} as const;

export const VERSE = {
  minCharacters: 3,
  topN: 5,
  peakWeight: 0.6,
} as const;

export const PROOF = {
  videoHosts: ["youtube.com", "youtu.be", "vimeo.com", "bilibili.com", "dailymotion.com"],
  /** Shorteners hide the destination, so they are not accepted as proof */
  blockedHosts: ["bit.ly", "t.co", "tinyurl.com", "goo.gl", "is.gd", "ow.ly", "cutt.ly", "rb.gy"],
  maxUrlLength: 2048,
  excerptMin: 20,
} as const;