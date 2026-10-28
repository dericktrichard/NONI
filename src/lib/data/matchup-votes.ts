import "server-only";
import { Timestamp } from "firebase-admin/firestore";
import { HttpError } from "@/lib/data/feats";
import { adminDb } from "@/lib/firebase/admin";
import { COL, matchupId } from "@/lib/firebase/paths";
import {
  applyMatchupVote,
  orderPair,
  toCanonicalPick,
  toViewTally,
  type RequestedPick,
  type ViewTally,
  type VotePick,
} from "@/lib/matchup/vote";

export interface MatchupVoteResult extends ViewTally {
  pick: RequestedPick;
}

function optionalString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

export async function castMatchupVote(
  uid: string,
  input: { a: string; b: string; pick: RequestedPick },
): Promise<MatchupVoteResult> {
  const db = adminDb();
  const { first, second, flipped } = orderPair(input.a, input.b);
  const id = matchupId(input.a, input.b);
  const matchupRef = db.collection(COL.matchups).doc(id);
  const voteRef = matchupRef.collection(COL.votes).doc(uid);
  const firstRef = db.collection(COL.characters).doc(first);
  const secondRef = db.collection(COL.characters).doc(second);
  const next = toCanonicalPick(input.pick, flipped);

  const tally = await db.runTransaction(async (tx) => {
    const [matchup, vote, firstChar, secondChar] = await Promise.all([
      tx.get(matchupRef),
      tx.get(voteRef),
      tx.get(firstRef),
      tx.get(secondRef),
    ]);
    if (!firstChar.exists || !secondChar.exists) throw new HttpError(404, "Character not found.");

    const stored = vote.exists ? vote.get("side") : null;
    const previous: VotePick = stored === "a" || stored === "b" ? stored : null;
    const current = {
      votesA: Number(matchup.get("votesA")) || 0,
      votesB: Number(matchup.get("votesB")) || 0,
    };
    if (previous === next) return current;

    const updated = applyMatchupVote(current, previous, next);
    const now = Timestamp.now();

    if (matchup.exists) {
      tx.update(matchupRef, { ...updated, lastActivityAt: now });
    } else {
      tx.create(matchupRef, {
        characterAId: first,
        characterBId: second,
        characterIds: [first, second],
        aName: String(firstChar.get("name") ?? first),
        bName: String(secondChar.get("name") ?? second),
        aImageUrl: optionalString(firstChar.get("imageUrl")),
        bImageUrl: optionalString(secondChar.get("imageUrl")),
        ...updated,
        argumentCount: 0,
        createdBy: uid,
        createdAt: now,
        lastActivityAt: now,
      });
    }

    if (next === null) {
      tx.delete(voteRef);
    } else {
      tx.set(voteRef, {
        uid,
        matchupId: id,
        side: next,
        createdAt: vote.exists ? vote.get("createdAt") : now,
      });
    }

    return updated;
  });

  return { ...toViewTally(tally, flipped), pick: input.pick };
}