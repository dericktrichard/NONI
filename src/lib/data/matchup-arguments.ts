import "server-only";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { HttpError } from "@/lib/data/feats";
import { adminDb } from "@/lib/firebase/admin";
import { COL, matchupId } from "@/lib/firebase/paths";
import { CITATION_MESSAGES, checkCitationScope, checkCitedFeats } from "@/lib/matchup/arguments";
import { orderPair, toCanonicalPick } from "@/lib/matchup/vote";
import { pseudonymFor } from "@/lib/security/pseudonym";
import type { ArgumentInput } from "@/lib/validation/argument";

function optionalString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

export async function createArgument(uid: string, input: ArgumentInput): Promise<void> {
  const db = adminDb();
  const { first, second, flipped } = orderPair(input.a, input.b);

  const scopeIssue = checkCitationScope(input.citations, [first, second]);
  if (scopeIssue) throw new HttpError(400, CITATION_MESSAGES[scopeIssue]);

  const side = toCanonicalPick(input.side, flipped);
  if (side === null) throw new HttpError(400, "Choose a side.");

  const id = matchupId(input.a, input.b);
  const matchupRef = db.collection(COL.matchups).doc(id);
  const argumentRef = matchupRef.collection(COL.arguments).doc(uid);
  const firstRef = db.collection(COL.characters).doc(first);
  const secondRef = db.collection(COL.characters).doc(second);
  const featRefs = input.citations.map((citation) =>
    db.collection(COL.characters).doc(citation.characterId).collection(COL.feats).doc(citation.featId),
  );

  await db.runTransaction(async (tx) => {
    const [matchup, existing, firstChar, secondChar] = await Promise.all([
      tx.get(matchupRef),
      tx.get(argumentRef),
      tx.get(firstRef),
      tx.get(secondRef),
    ]);
    const feats = await Promise.all(featRefs.map((ref) => tx.get(ref)));

    if (!firstChar.exists || !secondChar.exists) throw new HttpError(404, "Character not found.");
    if (existing.exists) throw new HttpError(409, "You already posted an argument for this matchup.");

    const citedIssue = checkCitedFeats(feats.map((feat) => ({ exists: feat.exists, status: feat.get("status") })));
    if (citedIssue) throw new HttpError(400, CITATION_MESSAGES[citedIssue]);

    const now = Timestamp.now();

    if (matchup.exists) {
      tx.update(matchupRef, { argumentCount: FieldValue.increment(1), lastActivityAt: now });
    } else {
      tx.create(matchupRef, {
        characterAId: first,
        characterBId: second,
        characterIds: [first, second],
        aName: String(firstChar.get("name") ?? first),
        bName: String(secondChar.get("name") ?? second),
        aImageUrl: optionalString(firstChar.get("imageUrl")),
        bImageUrl: optionalString(secondChar.get("imageUrl")),
        votesA: 0,
        votesB: 0,
        argumentCount: 1,
        createdBy: uid,
        createdAt: now,
        lastActivityAt: now,
      });
    }

    tx.create(argumentRef, {
      authorId: uid,
      authorName: pseudonymFor(uid),
      side,
      body: input.body,
      citations: input.citations.map((citation, index) => ({
        characterId: citation.characterId,
        featId: citation.featId,
        title: String(feats[index].get("title") ?? ""),
      })),
      status: "visible",
      upvotes: 0,
      downvotes: 0,
      netScore: 0,
      createdAt: now,
    });
  });
}