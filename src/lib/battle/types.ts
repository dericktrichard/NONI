import type { CombatProfile } from "@/lib/ranking/profile";

/** A character as the battle code sees it: combat numbers plus what the screens need */
export interface Entrant {
  profile: CombatProfile;
  verse: string;
  /** 0 to 10,000 ranking score. Keeps random teams inside one power band and settles stalemates in a bracket. */
  score: number;
}

export type Difficulty = "fair" | "hard";

export const cmp = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0);

/** Fisher-Yates with a supplied random source. Returns a new array. */
export function shuffled<T>(items: readonly T[], rng: () => number): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
  }
  return copy;
}