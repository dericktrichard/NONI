export type CanonicalSide = "a" | "b";
export type VotePick = CanonicalSide | null;
export type RequestedPick = "a" | "b" | "none";

export interface Tally {
  votesA: number;
  votesB: number;
}

export interface ViewTally {
  a: number;
  b: number;
}

export interface Pair {
  first: string;
  second: string;
  flipped: boolean;
}

export function orderPair(a: string, b: string): Pair {
  return a < b ? { first: a, second: b, flipped: false } : { first: b, second: a, flipped: true };
}

export function toCanonicalPick(pick: RequestedPick, flipped: boolean): VotePick {
  if (pick === "none") return null;
  if (!flipped) return pick;
  return pick === "a" ? "b" : "a";
}

export function toViewPick(side: VotePick, flipped: boolean): RequestedPick {
  if (side === null) return "none";
  if (!flipped) return side;
  return side === "a" ? "b" : "a";
}

export function toViewTally(tally: Tally, flipped: boolean): ViewTally {
  return flipped ? { a: tally.votesB, b: tally.votesA } : { a: tally.votesA, b: tally.votesB };
}

export function applyMatchupVote(tally: Tally, previous: VotePick, next: VotePick): Tally {
  let { votesA, votesB } = tally;
  if (previous === "a") votesA -= 1;
  if (previous === "b") votesB -= 1;
  if (next === "a") votesA += 1;
  if (next === "b") votesB += 1;
  return { votesA: Math.max(0, votesA), votesB: Math.max(0, votesB) };
}

export function sharePercent(count: number, total: number): number {
  return total > 0 ? Math.round((count / total) * 100) : 0;
}