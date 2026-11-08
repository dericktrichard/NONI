export interface PlayCharacter {
  id: string;
  name: string;
  verse: string;
  tier: string;
  score: number;
  imageUrl: string | null;
}

export interface Duel {
  left: PlayCharacter;
  right: PlayCharacter;
}

export type Guess = "higher" | "lower";

export const DAILY_ROUNDS = 10;

export function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function hashSeed(text: string): number {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function isCorrect(duel: Duel, guess: Guess): boolean {
  return guess === "higher" ? duel.right.score > duel.left.score : duel.right.score < duel.left.score;
}

/** A character with a different score from `left`, so a round always has an answer */
export function pickRight(pool: readonly PlayCharacter[], left: PlayCharacter, rng: () => number): PlayCharacter | null {
  const options = pool.filter((item) => item.id !== left.id && item.score !== left.score);
  if (options.length === 0) return null;
  return options[Math.floor(rng() * options.length)]!;
}

export function firstDuel(pool: readonly PlayCharacter[], rng: () => number): Duel | null {
  if (pool.length < 2) return null;
  const left = pool[Math.floor(rng() * pool.length)]!;
  const right = pickRight(pool, left, rng);
  return right ? { left, right } : null;
}

/** The same chain of duels for everyone on a given day. Each round's right side becomes the next left side. */
export function buildDaily(pool: readonly PlayCharacter[], day: string, rounds = DAILY_ROUNDS): Duel[] {
  const rng = mulberry32(hashSeed(`noni:daily:${day}`));
  const shuffled = [...pool].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!];
  }

  const chain: PlayCharacter[] = [];
  while (chain.length < rounds + 1 && shuffled.length > 0) {
    const last = chain[chain.length - 1];
    const at = last ? shuffled.findIndex((item) => item.score !== last.score) : 0;
    if (at === -1) break;
    chain.push(shuffled.splice(at, 1)[0]!);
  }

  return chain.slice(1).map((right, index) => ({ left: chain[index]!, right }));
}