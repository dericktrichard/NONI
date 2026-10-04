import {
  COVERAGE_FLOOR,
  COVERAGE_FULL_AT,
  LOWEST_TIER,
  STAT_WEIGHTS,
  TIER_CUTOFFS,
} from "@/config/ranking";
import { STAT_KEYS, type StatKey } from "@/config/stats";
import type { Tier } from "@/types/character";
import type { FeatStatus } from "@/types/domain";

export type StatSheet = Record<StatKey, number>;
export type StatPeaks = Partial<Record<StatKey, number>>;

const clamp100 = (n: number) => (Number.isFinite(n) ? Math.min(100, Math.max(0, n)) : 0);

/**
 * Highest verified rating per stat. The server will usually get these from six
 * small "top one" queries instead of reading every feat. This helper does the
 * same job on an in-memory list, for tests and seeding.
 */
export function peakRatings(
  feats: ReadonlyArray<{ stat: StatKey; rating: number; status: FeatStatus }>,
): StatPeaks {
  const peaks: StatPeaks = {};
  for (const feat of feats) {
    if (feat.status !== "verified") continue;
    const rating = clamp100(feat.rating);
    const current = peaks[feat.stat];
    if (current === undefined || rating > current) peaks[feat.stat] = rating;
  }
  return peaks;
}

/** A verified peak replaces the seeded baseline for that stat */
export function resolveStatSheet(seed: StatSheet, peaks: StatPeaks): StatSheet {
  const sheet = {} as StatSheet;
  for (const key of STAT_KEYS) sheet[key] = clamp100(peaks[key] ?? seed[key]);
  return sheet;
}

/** Weighted stats on a 0 to 10,000 scale.*/
export function rawPower(sheet: StatSheet): number {
  let total = 0;
  for (const key of STAT_KEYS) total += STAT_WEIGHTS[key] * clamp100(sheet[key]);
  return total;
}

/** 0 to 1: how much of the full evidence requirement the verified feats cover */
export function evidenceCoverage(verifiedFeatCount: number): number {
  return Math.min(1, Math.max(0, verifiedFeatCount) / COVERAGE_FULL_AT);
}

export function computeScore(sheet: StatSheet, verifiedFeatCount: number): number {
  const factor = COVERAGE_FLOOR + (1 - COVERAGE_FLOOR) * evidenceCoverage(verifiedFeatCount);
  return Math.round(rawPower(sheet) * factor);
}

export function tierFromScore(score: number): Tier {
  for (const [tier, minimum] of TIER_CUTOFFS) {
    if (score >= minimum) return tier;
  }
  return LOWEST_TIER;
}

/** Share of a character's feats that are verified, for the evidence meter */
export function evidenceShare(verifiedFeatCount: number, featCount: number): number {
  if (featCount <= 0) return 0;
  return Math.min(1, Math.max(0, verifiedFeatCount / featCount));
}

export interface Rankable {
  slug: string;
  name: string;
  score: number;
  verifiedFeatCount: number;
}

// Plain code-unit comparison, so the order never depends on locale or ICU data
const cmp = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);

/** Score, then verified feats, then name, then slug (unique, so the order is total) */
export function compareCharacters(a: Rankable, b: Rankable): number {
  return (
    b.score - a.score ||
    b.verifiedFeatCount - a.verifiedFeatCount ||
    cmp(a.name.toLowerCase(), b.name.toLowerCase()) ||
    cmp(a.slug, b.slug)
  );
}