import "server-only";
import { Timestamp, FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { COL } from "@/lib/firebase/paths";
import { decideFeatStatus } from "@/lib/ranking/verification";
import { validateFeatProofs } from "@/lib/ranking/proof";
import type { FeatClaim } from "@/lib/ranking/profile";
import { recomputeProfile } from "@/lib/ranking/recompute";
import { evidenceShare } from "@/lib/ranking/score";
import { applyVote, type VoteValue } from "@/lib/ranking/vote";
import { pseudonymFor } from "@/lib/security/pseudonym";
import type { FeatStatus, PowerProfile, Proof } from "@/types/domain";

const MAX_VERIFIED_READ = 500;

export class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

export interface NewFeat {
  characterId: string;
  title: string;
  description: string;
  claim: FeatClaim;
  proofs: Proof[];
}

export async function submitFeat(uid: string, feat: NewFeat): Promise<string> {
  const db = adminDb();
  const characterRef = db.collection(COL.characters).doc(feat.characterId);
  const featRef = characterRef.collection(COL.feats).doc();
  const userRef = db.collection(COL.users).doc(uid);

  await db.runTransaction(async (tx) => {
    const character = await tx.get(characterRef);
    if (!character.exists) throw new HttpError(404, "Character not found.");

    const featCount = (Number(character.get("featCount")) || 0) + 1;
    const verified = Number(character.get("verifiedFeatCount")) || 0;
    const now = Timestamp.now();

    tx.create(featRef, {
      characterId: feat.characterId,
      authorId: uid,
      authorName: pseudonymFor(uid),
      title: feat.title,
      description: feat.description,
      category: feat.claim.category,
      claim: feat.claim,
      proofs: feat.proofs,
      status: "pending" satisfies FeatStatus,
      staffLocked: false,
      upvotes: 0,
      downvotes: 0,
      netScore: 0,
      createdAt: now,
      updatedAt: now,
      verifiedAt: null,
    });
    tx.update(characterRef, { featCount, evidence: evidenceShare(verified, featCount), updatedAt: now });
    tx.set(userRef, { featsSubmitted: FieldValue.increment(1) }, { merge: true });
  });

  return featRef.id;
}

export interface VoteResult {
  status: FeatStatus;
  upvotes: number;
  downvotes: number;
  value: VoteValue;
}

export async function castVote(
  uid: string,
  characterId: string,
  featId: string,
  next: VoteValue,
): Promise<VoteResult> {
  const db = adminDb();
  const featRef = db.collection(COL.characters).doc(characterId).collection(COL.feats).doc(featId);
  const voteRef = featRef.collection(COL.votes).doc(uid);

  const outcome = await db.runTransaction(async (tx) => {
    const [feat, vote] = await Promise.all([tx.get(featRef), tx.get(voteRef)]);
    if (!feat.exists) throw new HttpError(404, "Feat not found.");

    const current = feat.get("status") as FeatStatus;
    if (feat.get("authorId") === uid) throw new HttpError(403, "You cannot vote on your own feat.");
    if (current === "rejected") throw new HttpError(409, "Voting is closed on this feat.");

    const stored = vote.exists ? Number(vote.get("value")) : 0;
    const previous: VoteValue = stored === 1 ? 1 : stored === -1 ? -1 : 0;
    const tally = applyVote(
      { upvotes: Number(feat.get("upvotes")) || 0, downvotes: Number(feat.get("downvotes")) || 0 },
      previous,
      next,
    );

    const status = decideFeatStatus({
      ...tally,
      current,
      proofsValid: validateFeatProofs((feat.get("proofs") ?? []) as Proof[]).length === 0,
      staffLocked: feat.get("staffLocked") === true,
    });

    const now = Timestamp.now();
    if (previous !== next) {
      let verifiedAt = feat.get("verifiedAt") ?? null;
      if (status !== "verified") verifiedAt = null;
      else if (current !== "verified") verifiedAt = now;

      tx.update(featRef, {
        upvotes: tally.upvotes,
        downvotes: tally.downvotes,
        netScore: tally.upvotes - tally.downvotes,
        status,
        verifiedAt,
        updatedAt: now,
      });

      if (next === 0) tx.delete(voteRef);
      else {
        tx.set(voteRef, {
          uid,
          characterId,
          featId,
          value: next,
          createdAt: vote.exists ? vote.get("createdAt") : now,
        });
      }
    }

    return { result: { status, ...tally, value: next }, reprofile: status !== current };
  });

  if (outcome.reprofile) await recomputeCharacter(characterId);
  return outcome.result;
}

export async function recomputeCharacter(characterId: string): Promise<void> {
  const characterRef = adminDb().collection(COL.characters).doc(characterId);
  const character = await characterRef.get();
  if (!character.exists) return;

  const verified = await characterRef
    .collection(COL.feats)
    .where("status", "==", "verified")
    .limit(MAX_VERIFIED_READ)
    .get();

  const result = recomputeProfile({
    slug: character.id,
    name: String(character.get("name")),
    seed: character.get("seed") as PowerProfile,
    featCount: Number(character.get("featCount")) || 0,
    feats: verified.docs.map((doc) => ({ claim: doc.get("claim") as FeatClaim, status: "verified" as const })),
  });

  await characterRef.update({
    profile: result.profile,
    tier: result.tier,
    tierGroup: result.tierGroup,
    speed: result.speed,
    verifiedFeatCount: result.verifiedFeatCount,
    evidence: result.evidence,
    updatedAt: Timestamp.now(),
  });
}