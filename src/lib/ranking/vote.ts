import type { VoteTally } from "@/lib/ranking/verification";

export type VoteValue = -1 | 0 | 1;

export function applyVote(tally: VoteTally, previous: VoteValue, next: VoteValue): VoteTally {
  let { upvotes, downvotes } = tally;
  if (previous === 1) upvotes -= 1;
  if (previous === -1) downvotes -= 1;
  if (next === 1) upvotes += 1;
  if (next === -1) downvotes += 1;
  return { upvotes: Math.max(0, upvotes), downvotes: Math.max(0, downvotes) };
}