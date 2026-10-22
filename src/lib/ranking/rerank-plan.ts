import type { FieldEntry } from "@/lib/ranking/field";

export interface ExistingRank {
  rank: number | null;
  score: number;
  winRate: number;
  wins: number;
  losses: number;
}

export interface RankUpdate {
  slug: string;
  score: number;
  winRate: number;
  wins: number;
  losses: number;
  rank: number;
  previousRank?: number;
}

export function planRerank(ranked: readonly FieldEntry[], existing: ReadonlyMap<string, ExistingRank>): RankUpdate[] {
  const updates: RankUpdate[] = [];

  ranked.forEach((entry, index) => {
    const rank = index + 1;
    const before = existing.get(entry.slug);
    const unchanged =
      before !== undefined &&
      before.rank === rank &&
      before.score === entry.score &&
      before.wins === entry.wins &&
      before.losses === entry.losses &&
      Math.abs(before.winRate - entry.winRate) < 1e-9;
    if (unchanged) return;

    const update: RankUpdate = {
      slug: entry.slug,
      score: entry.score,
      winRate: entry.winRate,
      wins: entry.wins,
      losses: entry.losses,
      rank,
    };
    if (before && typeof before.rank === "number" && before.rank !== rank) update.previousRank = before.rank;
    updates.push(update);
  });

  return updates;
}