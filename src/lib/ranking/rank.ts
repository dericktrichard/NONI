import { compareCharacters, type Rankable } from "./score";

export interface RankInput extends Rankable {
  rank: number | null;
  previousRank: number | null;
}

export interface RankResult {
  slug: string;
  rank: number;
  previousRank: number | null;
  /** Positive means the character moved up */
  trend: number;
}

export function trendOf(rank: number, previousRank: number | null): number {
  return previousRank === null ? 0 : previousRank - rank;
}

/**
 * Assigns 1-based ranks. With rollPrevious true (the scheduled snapshot), each
 * character's old rank becomes its previousRank. With false (a recalculation
 * between snapshots), previousRank is left alone, so the trend always means
 * "movement since the last snapshot".
 */
export function assignRanks(
  items: readonly RankInput[],
  options: { rollPrevious: boolean },
): RankResult[] {
  return [...items].sort(compareCharacters).map((item, index) => {
    const rank = index + 1;
    const previousRank = options.rollPrevious ? item.rank : item.previousRank;
    return { slug: item.slug, rank, previousRank, trend: trendOf(rank, previousRank) };
  });
}