import "server-only";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { HttpError } from "@/lib/data/feats";
import { adminDb } from "@/lib/firebase/admin";
import { COL } from "@/lib/firebase/paths";
import {
  parseFeatImport,
  planFeatImport,
  titleKey,
  type FeatPlan,
  type PlannedFeat,
} from "@/lib/import/feats";
import { evidenceShare } from "@/lib/ranking/score";

const IMPORT_AUTHOR = "system-import";
const TITLE_READ_LIMIT = 300;

interface Stored {
  featCount: number;
  verified: number;
}

export interface FeatReview {
  items: PlannedFeat[];
  plan: FeatPlan;
  stored: Map<string, Stored>;
}

export async function reviewFeatImport(text: string): Promise<FeatReview> {
  const parsed = parseFeatImport(text);
  if (!parsed.ok) throw new HttpError(400, parsed.error);

  const db = adminDb();
  const slugs = [...new Set(parsed.rows.map((row) => row.characterId))];
  const docs = await db.getAll(
    ...slugs.map((slug) => db.collection(COL.characters).doc(slug)),
    { fieldMask: ["featCount", "verifiedFeatCount"] },
  );

  const stored = new Map<string, Stored>();
  const titles = new Map<string, Set<string>>();
  const found = docs.filter((doc) => doc.exists);
  for (const doc of found) {
    stored.set(doc.id, {
      featCount: Number(doc.get("featCount")) || 0,
      verified: Number(doc.get("verifiedFeatCount")) || 0,
    });
  }
  await Promise.all(
    found.map(async (doc) => {
      const feats = await doc.ref
        .collection(COL.feats)
        .select("title")
        .limit(TITLE_READ_LIMIT)
        .get();
      titles.set(
        doc.id,
        new Set(feats.docs.map((f) => titleKey(String(f.get("title"))))),
      );
    }),
  );

  const plan = planFeatImport(parsed.rows, titles);
  return { items: plan.items, plan, stored };
}

/** Creates every new feat as pending, in one batch with one log entry. Nothing arrives verified. */
export async function commitFeatImport(
  actorUid: string,
  text: string,
): Promise<{ created: number; items: PlannedFeat[] }> {
  const { items, plan, stored } = await reviewFeatImport(text);
  if (plan.ready.length === 0) return { created: 0, items };

  const db = adminDb();
  const now = Timestamp.now();
  const batch = db.batch();
  const added = new Map<string, number>();

  for (const feat of plan.ready) {
    const characterRef = db.collection(COL.characters).doc(feat.characterId);
    batch.create(characterRef.collection(COL.feats).doc(), {
      characterId: feat.characterId,
      authorId: IMPORT_AUTHOR,
      authorName: "NONI editors",
      title: feat.title,
      description: feat.description,
      category: feat.claim.category,
      claim: feat.claim,
      proofs: feat.proofs,
      status: "pending",
      staffLocked: false,
      imported: true,
      upvotes: 0,
      downvotes: 0,
      netScore: 0,
      createdAt: now,
      updatedAt: now,
      verifiedAt: null,
    });
    added.set(feat.characterId, (added.get(feat.characterId) ?? 0) + 1);
  }

  for (const [slug, count] of added) {
    const current = stored.get(slug)!;
    const featCount = current.featCount + count;
    batch.update(db.collection(COL.characters).doc(slug), {
      featCount,
      evidence: evidenceShare(current.verified, featCount),
      updatedAt: now,
    });
  }

  batch.create(db.collection(COL.modLog).doc(), {
    targetType: "character",
    action: "import-feats",
    actorUid,
    count: plan.ready.length,
    characters: added.size,
    at: FieldValue.serverTimestamp(),
  });

  await batch.commit();
  return { created: plan.ready.length, items };
}
