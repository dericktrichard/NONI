import { resolveMatchup, winProbability } from "@/lib/ranking/matchup";
import { CLIMB } from "./config";
import { reasonFor } from "./clash";
import { cmp, shuffled, type Difficulty, type Entrant } from "./types";

export type ClimbMode = "counters" | "random";

export interface ClimbMatch {
  round: number;
  a: string;
  b: string;
  aName: string;
  bName: string;
  winner: string;
  probabilityA: number;
  note: string;
}

export interface ClimbResult {
  size: number;
  rounds: ClimbMatch[][];
  hero: string;
  /** Rounds the hero won, from 0 to the number of rounds */
  wins: number;
  champion: string;
  /** The slug that ended the run, null for a champion */
  beatenBy: string | null;
}

export const isBracketSize = (n: number): boolean => Number.isInteger(n) && n >= 2 && (n & (n - 1)) === 0;

function decide(a: Entrant, b: Entrant): { winner: Entrant; probabilityA: number; note: string } {
  const result = resolveMatchup(a.profile, b.profile);
  let side = result.winner;
  if (side === null) side = a.score !== b.score ? (a.score > b.score ? "a" : "b") : cmp(a.profile.slug, b.profile.slug) <= 0 ? "a" : "b";
  const note = result.winner === null ? "Too close to call, the higher ranked fighter advances." : reasonFor(result, side);
  return { winner: side === "a" ? a : b, probabilityA: result.probabilityA, note };
}

function closest<T>(items: readonly T[], target: number, measure: (item: T) => number, slugOf: (item: T) => string): T | undefined {
  return [...items].sort((x, y) => Math.abs(measure(x) - target) - Math.abs(measure(y) - target) || cmp(slugOf(x), slugOf(y)))[0];
}

/**
 * Seats the hero at slot 0. In counters mode the strongest rival of each round is chosen to
 * answer the hero and placed where the hero will meet them. Other seats hold fillers that
 * lose to that rival. Everything is then simulated, so the report is the truth, not the plan.
 */
export function buildClimb(
  pool: readonly Entrant[],
  hero: Entrant,
  size: number,
  mode: ClimbMode,
  difficulty: Difficulty,
  rng: () => number = Math.random,
): ClimbResult | null {
  if (!isBracketSize(size) || size < 4) return null;
  const others = pool.filter((e) => e.profile.slug !== hero.profile.slug).sort((x, y) => cmp(x.profile.slug, y.profile.slug));
  if (others.length < size - 1) return null;

  const rounds = Math.log2(size);
  const seats: Entrant[] = new Array(size);
  seats[0] = hero;
  const used = new Set<string>([hero.profile.slug]);
  const take = (e: Entrant) => used.add(e.profile.slug);
  const free = () => others.filter((e) => !used.has(e.profile.slug));

  if (mode === "random") {
    const picked = shuffled(others, rng).slice(0, size - 1);
    picked.forEach((e, i) => (seats[i + 1] = e));
  } else {
    const range = difficulty === "hard" ? CLIMB.hard : CLIMB.fair;
    for (let r = 0; r < rounds; r += 1) {
      const target = rounds === 1 ? range.to : range.from + ((range.to - range.from) * r) / (rounds - 1);
      const rival = closest(free(), target, (e) => winProbability(e.profile, hero.profile), (e) => e.profile.slug);
      if (!rival) return null;
      take(rival);
      const start = 2 ** r;
      seats[start] = rival;
      const weaker = free().filter((e) => winProbability(rival.profile, e.profile) >= CLIMB.fillerLoseAt);
      for (let s = start + 1; s < start * 2; s += 1) {
        const filler = shuffled(weaker.filter((e) => !used.has(e.profile.slug)), rng)[0] ?? free()[0];
        if (!filler) return null;
        take(filler);
        seats[s] = filler;
      }
    }
  }

  let field = seats;
  const played: ClimbMatch[][] = [];
  let wins = 0;
  let beatenBy: string | null = null;
  let alive = true;

  for (let r = 0; r < rounds; r += 1) {
    const next: Entrant[] = [];
    const matches: ClimbMatch[] = [];
    for (let i = 0; i < field.length; i += 2) {
      const a = field[i]!;
      const b = field[i + 1]!;
      const out = decide(a, b);
      next.push(out.winner);
      matches.push({
        round: r + 1,
        a: a.profile.slug,
        b: b.profile.slug,
        aName: a.profile.name,
        bName: b.profile.name,
        winner: out.winner.profile.slug,
        probabilityA: out.probabilityA,
        note: out.note,
      });
      if (alive && (a === hero || b === hero)) {
        if (out.winner === hero) wins += 1;
        else {
          alive = false;
          beatenBy = out.winner.profile.slug;
        }
      }
    }
    played.push(matches);
    field = next;
  }

  return { size, rounds: played, hero: hero.profile.slug, wins, champion: field[0]!.profile.slug, beatenBy };
}