import "server-only";
import { FieldValue, type Firestore, type Query } from "firebase-admin/firestore";
import { HttpError } from "@/lib/data/feats";
import { rerankAll } from "@/lib/data/rerank";
import { adminDb } from "@/lib/firebase/admin";
import { COL } from "@/lib/firebase/paths";

const MATCHUP_PASS = 100;
const REPORT_BATCH = 400;
const MAX_PASSES = 50;

export interface DeleteResult {
  matchupsDeleted: number;
  reportsDeleted: number;
}

async function deleteMatchups(db: Firestore, slug: string): Promise<number> {
  let total = 0;
  for (let pass = 0; pass < MAX_PASSES; pass += 1) {
    const snapshot = await db
      .collection(COL.matchups)
      .where("characterIds", "array-contains", slug)
      .limit(MATCHUP_PASS)
      .get();
    if (snapshot.empty) break;
    for (const doc of snapshot.docs) await db.recursiveDelete(doc.ref);
    total += snapshot.size;
  }
  return total;
}

async function deleteMatching(db: Firestore, query: Query): Promise<number> {
  let total = 0;
  for (let pass = 0; pass < MAX_PASSES; pass += 1) {
    const snapshot = await query.limit(REPORT_BATCH).get();
    if (snapshot.empty) break;
    const batch = db.batch();
    snapshot.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
    total += snapshot.size;
  }
  return total;
}

export async function deleteCharacter(actorUid: string, slug: string): Promise<DeleteResult> {
  const db = adminDb();
  const characterRef = db.collection(COL.characters).doc(slug);
  const character = await characterRef.get();
  if (!character.exists) throw new HttpError(404, "Character not found.");

  const name = String(character.get("name") ?? slug);
  const featCount = Number(character.get("featCount")) || 0;

  const matchupsDeleted = await deleteMatchups(db, slug);

  const reports = db.collection(COL.reports);
  const reportsDeleted =
    (await deleteMatching(db, reports.where("characterId", "==", slug))) +
    (await deleteMatching(db, reports.where("a", "==", slug))) +
    (await deleteMatching(db, reports.where("b", "==", slug)));

  await db.recursiveDelete(characterRef);

  await db.collection(COL.modLog).doc().create({
    targetType: "character",
    action: "delete",
    actorUid,
    characterId: slug,
    name,
    featCount,
    matchupsDeleted,
    reportsDeleted,
    at: FieldValue.serverTimestamp(),
  });

  await rerankAll(db).catch((error) => console.error("rerank failed", error));

  return { matchupsDeleted, reportsDeleted };
}