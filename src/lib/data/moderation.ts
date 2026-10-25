import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { COL } from "@/lib/firebase/paths";
import { HttpError, recomputeCharacter } from "@/lib/data/feats";
import { rerankAll } from "@/lib/data/rerank";
import {
  applyModAction,
  verificationChanged,
  type ModAction,
  type ReportReason,
} from "@/lib/moderation/actions";
import type { FeatStatus } from "@/types/domain";

const MAX_REPORTS_PER_FEAT = 100;

function featRefOf(characterId: string, featId: string) {
  return adminDb().collection(COL.characters).doc(characterId).collection(COL.feats).doc(featId);
}

export async function reportFeat(
  uid: string,
  input: { characterId: string; featId: string; reason: ReportReason; note?: string },
): Promise<void> {
  const db = adminDb();
  const featRef = featRefOf(input.characterId, input.featId);
  const reportRef = db.collection(COL.reports).doc(`${input.featId}_${uid}`);

  await db.runTransaction(async (tx) => {
    const [feat, existing] = await Promise.all([tx.get(featRef), tx.get(reportRef)]);
    if (!feat.exists) throw new HttpError(404, "Feat not found.");
    if (feat.get("authorId") === uid) throw new HttpError(403, "You cannot report your own feat.");
    if (existing.exists) throw new HttpError(409, "You already reported this feat.");

    tx.create(reportRef, {
      featId: input.featId,
      characterId: input.characterId,
      reporterUid: uid,
      reason: input.reason,
      note: input.note ?? "",
      status: "open",
      createdAt: FieldValue.serverTimestamp(),
    });
    tx.update(featRef, { openReports: FieldValue.increment(1) });
  });
}

export async function moderateFeat(
  actorUid: string,
  input: { characterId: string; featId: string; action: ModAction; note?: string },
): Promise<{ status: FeatStatus; changedVerified: boolean }> {
  const db = adminDb();
  const featRef = featRefOf(input.characterId, input.featId);

  const result = await db.runTransaction(async (tx) => {
    const feat = await tx.get(featRef);
    if (!feat.exists) throw new HttpError(404, "Feat not found.");

    const before = feat.get("status") as FeatStatus;
    const outcome = applyModAction(input.action, {
      status: before,
      staffLocked: feat.get("staffLocked") === true,
      upvotes: Number(feat.get("upvotes") ?? 0),
      downvotes: Number(feat.get("downvotes") ?? 0),
      proofsValid: true,
    });

    const open = await tx.get(
      db
        .collection(COL.reports)
        .where("featId", "==", input.featId)
        .where("status", "==", "open")
        .limit(MAX_REPORTS_PER_FEAT),
    );

    if (outcome.touchesFeat) {
      tx.update(featRef, {
        status: outcome.status,
        staffLocked: outcome.staffLocked,
        openReports: 0,
        updatedAt: FieldValue.serverTimestamp(),
      });
    } else {
      tx.update(featRef, { openReports: 0 });
    }

    for (const report of open.docs) {
      tx.update(report.ref, {
        status: outcome.reportStatus,
        resolvedBy: actorUid,
        resolvedAt: FieldValue.serverTimestamp(),
      });
    }

    tx.create(db.collection(COL.modLog).doc(), {
      actorUid,
      action: input.action,
      featId: input.featId,
      characterId: input.characterId,
      from: before,
      to: outcome.status,
      reportsClosed: open.size,
      note: input.note ?? "",
      at: FieldValue.serverTimestamp(),
    });

    return { status: outcome.status, changedVerified: verificationChanged(before, outcome.status) };
  });

  if (result.changedVerified) {
    await recomputeCharacter(input.characterId);
    rerankAll(db).catch((error) => console.error("rerank failed", error));
  }

  return result;
}