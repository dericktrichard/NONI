import type { ClimbMatch, ClimbResult } from "./climb";

export function roundName(round: number, rounds: number, short = false): string {
  const left = rounds - round;
  if (left === 0) return "Final";
  if (left === 1) return short ? "Semi" : "Semi-final";
  if (left === 2) return short ? "Quarter" : "Quarter-final";
  const field = 2 ** (rounds - round + 1);
  return short ? `R${field}` : `Round of ${field}`;
}

/** Rounds the hero actually played, including the one they lost */
export const heroRounds = (result: ClimbResult): number =>
  result.wins + (result.beatenBy === null ? 0 : 1);

export function heroMatch(result: ClimbResult, round: number): ClimbMatch | undefined {
  if (round < 1 || round > heroRounds(result)) return undefined;
  return result.rounds[round - 1]?.find(
    (match) => match.a === result.hero || match.b === result.hero,
  );
}
