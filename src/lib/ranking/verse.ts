import { VERSE } from "@/config/ranking";

/** Null means the verse has too few characters to be ranked yet */
export function computeVerseScore(characterScores: readonly number[]): number | null {
  if (characterScores.length < VERSE.minCharacters) return null;

  const sorted = [...characterScores].sort((a, b) => b - a);
  const peak = sorted[0];
  const top = sorted.slice(0, VERSE.topN);
  const depth = top.reduce((sum, n) => sum + n, 0) / top.length;

  return Math.round(VERSE.peakWeight * peak + (1 - VERSE.peakWeight) * depth);
}

export interface VerseInput {
  id: string;
  name: string;
  score: number | null;
}

const cmp = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);

/** Unranked verses (null score) get a null rank and sort last */
export function rankVerses(verses: readonly VerseInput[]): Array<{ id: string; rank: number | null }> {
  const ranked = verses
    .filter((v): v is VerseInput & { score: number } => v.score !== null)
    .sort((a, b) => b.score - a.score || cmp(a.name.toLowerCase(), b.name.toLowerCase()) || cmp(a.id, b.id));

  const positions = new Map(ranked.map((v, i) => [v.id, i + 1]));
  return verses.map((v) => ({ id: v.id, rank: positions.get(v.id) ?? null }));
}