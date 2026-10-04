import { VERIFICATION } from "@/config/ranking";
import type { FeatStatus } from "@/types/domain";

export interface VoteTally {
  upvotes: number;
  downvotes: number;
}

export function approvalRatio({ upvotes, downvotes }: VoteTally): number {
  const total = upvotes + downvotes;
  return total > 0 ? upvotes / total : 0;
}

/**
 * Decides a feat's status from its tally. Pure: the caller supplies the current
 * status and writes the result.
 *
 * - staffLocked: a moderator decision is final until a moderator changes it.
 * - rejected is terminal here. Rejected feats are hidden by the rules, so no
 *   further votes arrive, and only staff can reinstate them.
 */
export function decideFeatStatus(
  input: VoteTally & {
    current: FeatStatus;
    proofsValid: boolean;
    staffLocked?: boolean;
  },
): FeatStatus {
  const { upvotes, downvotes, current, proofsValid, staffLocked } = input;

  if (staffLocked || current === "rejected") return current;
  if (!proofsValid) return "pending";

  const ratio = approvalRatio(input);

  if (current === "verified") {
    return ratio >= VERIFICATION.keepVerifiedRatio ? "verified" : "pending";
  }
  if (upvotes >= VERIFICATION.minUpvotes && ratio >= VERIFICATION.verifyRatio) {
    return "verified";
  }
  if (downvotes >= VERIFICATION.minDownvotes && ratio <= VERIFICATION.rejectRatio) {
    return "rejected";
  }
  return "pending";
}