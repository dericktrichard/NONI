import { COMBAT } from "@/config/combat";
import { winProbability } from "./matchup";
import type { CombatProfile } from "./profile";
import { compareCharacters } from "./score";

export const SCORE_MAX = 10_000;

/** Largest number of opponents each character faces. Keeps a full run cheap as the roster grows. */
export const DEFAULT_FIELD_CAP = 400;

export interface FieldEntry {
  slug: string;
  name: string;
  verifiedFeatCount: number;
  /** Mean win probability against the field, 0 to 1. The limit of an endless tournament. */
  winRate: number;
  /** winRate on a 0 to 10,000 scale, stored on the character document */
  score: number;
  wins: number;
  losses: number;
  /** Fights with no clear winner */
  even: number;
  opponents: number;
}

const cmp = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);

/**
 * The same field of opponents for everyone. Sorted by slug, then evenly spaced, so the
 * choice is deterministic and does not favour any power band.
 */
export function selectField(profiles: readonly CombatProfile[], cap: number): CombatProfile[] {
  const sorted = [...profiles].sort((x, y) => cmp(x.slug, y.slug));
  if (sorted.length <= cap) return sorted;
  const step = sorted.length / cap;
  return Array.from({ length: cap }, (_, i) => sorted[Math.floor(i * step)]);
}

/**
 * Every character fights every opponent in the field once. Averaging win probabilities is
 * what repeating a random tournament forever would converge to, computed exactly and
 * without randomness, so the result is identical on every run.
 */
export function evaluateField(
  profiles: readonly CombatProfile[],
  options: { cap?: number } = {},
): FieldEntry[] {
  const field = selectField(profiles, options.cap ?? DEFAULT_FIELD_CAP);

  return profiles.map((self) => {
    let total = 0;
    let wins = 0;
    let losses = 0;
    let even = 0;
    let opponents = 0;

    for (const other of field) {
      if (other.slug === self.slug) continue;
      const p = winProbability(self, other);
      total += p;
      opponents += 1;
      if (p > 0.5 + COMBAT.evenBand) wins += 1;
      else if (p < 0.5 - COMBAT.evenBand) losses += 1;
      else even += 1;
    }

    const winRate = opponents === 0 ? 0.5 : total / opponents;
    return {
      slug: self.slug,
      name: self.name,
      verifiedFeatCount: self.verifiedFeatCount,
      winRate,
      score: Math.round(winRate * SCORE_MAX),
      wins,
      losses,
      even,
      opponents,
    };
  });
}

/** Evaluated and ordered: score, then verified feats, then name, then slug */
export function rankField(
  profiles: readonly CombatProfile[],
  options: { cap?: number } = {},
): FieldEntry[] {
  return evaluateField(profiles, options).sort(compareCharacters);
}

/**
 * Rock-paper-scissors loops: A beats B, B beats C, C beats A, each by at least a narrow margin.
 * Cubic in the number of characters, so it is capped. Meant for a nightly job or a
 * "weird matchups" page, not for requests.
 */
export function findCycles(
  profiles: readonly CombatProfile[],
  options: { limit?: number; maxProfiles?: number } = {},
): string[][] {
  const limit = options.limit ?? 10;
  const pool = [...profiles]
    .sort((x, y) => cmp(x.slug, y.slug))
    .slice(0, options.maxProfiles ?? 60);

  const n = pool.length;
  const beats = pool.map((x) =>
    pool.map((y) => (x === y ? false : winProbability(x, y) >= COMBAT.verdict.narrow)),
  );

  const cycles: string[][] = [];
  for (let i = 0; i < n && cycles.length < limit; i++) {
    for (let j = i + 1; j < n && cycles.length < limit; j++) {
      for (let k = j + 1; k < n && cycles.length < limit; k++) {
        if (beats[i][j] && beats[j][k] && beats[k][i]) {
          cycles.push([pool[i].slug, pool[j].slug, pool[k].slug]);
        } else if (beats[i][k] && beats[k][j] && beats[j][i]) {
          cycles.push([pool[i].slug, pool[k].slug, pool[j].slug]);
        }
      }
    }
  }
  return cycles;
}
