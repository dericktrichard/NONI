import "server-only";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { HttpError } from "@/lib/data/feats";
import { rerankAll } from "@/lib/data/rerank";
import { adminDb } from "@/lib/firebase/admin";
import { COL, SLUG_RE } from "@/lib/firebase/paths";
import { PUBLISH, canPublish } from "@/lib/import/publish";
import {
  parseImport,
  planImport,
  rowSlug,
  type PlannedRow,
  type ReadyRow,
} from "@/lib/import/rows";
import { buildCharacterDocs, type CharacterDocData } from "@/lib/ranking/character-doc";

const FIRESTORE_ALREADY_EXISTS = 6;

export interface ImportReview {
  items: PlannedRow[];
  drafts: Array<{ row: ReadyRow; doc: CharacterDocData }>;
}

function draftDoc(row: ReadyRow): CharacterDocData | null {
  try {
    const [doc] = buildCharacterDocs([
      {
        profile: {
          slug: row.slug,
          name: row.name,
          attackPotency: row.attackPotency,
          durability: row.durability,
          speed: row.speed,
          dimension: row.dimension,
          hax: row.hax,
          resistances: row.resistances,
        },
        verse: row.verse,
        media: row.media,
        featCount: 0,
        aliases: row.aliases,
        tags: row.tags,
        entity: row.entity,
        continuity: row.continuity ?? undefined,
      },
    ]);
    return doc ?? null;
  } catch {
    return null;
  }
}

async function existingSlugs(slugs: string[]): Promise<Set<string>> {
  const unique = [...new Set(slugs)];
  if (unique.length === 0) return new Set();
  const db = adminDb();
  const docs = await db.getAll(
    ...unique.map((slug) => db.collection(COL.characters).doc(slug)),
    { fieldMask: ["name"] },
  );
  return new Set(docs.filter((doc) => doc.exists).map((doc) => doc.id));
}

/** Checks a file against the scales, itself and the database. Writes nothing. */
export async function reviewImport(text: string): Promise<ImportReview> {
  const parsed = parseImport(text);
  if (!parsed.ok) throw new HttpError(400, parsed.error);

  const slugs = parsed.rows
    .map(rowSlug)
    .filter((slug) => slug.length > 0 && slug.length <= 80 && SLUG_RE.test(slug));
  const plan = planImport(parsed.rows, await existingSlugs(slugs));

  const items = [...plan.items];
  const drafts: ImportReview["drafts"] = [];
  for (const row of plan.ready) {
    const doc = draftDoc(row);
    if (doc) {
      drafts.push({ row, doc });
      continue;
    }
    const at = items.findIndex((item) => item.slug === row.slug && item.status === "new");
    if (at >= 0) {
      items[at] = {
        ...items[at]!,
        status: "invalid",
        reason: "The power values or the entity do not fit together.",
      };
    }
  }
  return { items, drafts };
}

/** Creates every valid new row as an unranked draft, in one batch with one log entry */
export async function commitImport(
  actorUid: string,
  text: string,
): Promise<{ created: number; items: PlannedRow[] }> {
  const { items, drafts } = await reviewImport(text);
  if (drafts.length === 0) return { created: 0, items };

  const db = adminDb();
  const now = Timestamp.now();
  const batch = db.batch();

  for (const { row, doc } of drafts) {
    const fields = Object.fromEntries(
      Object.entries(doc).filter(([key]) => key !== "rank"),
    );
    batch.create(db.collection(COL.characters).doc(row.slug), {
      ...fields,
      draft: true,
      lead: row.lead ?? null,
      createdAt: now,
      updatedAt: now,
    });
  }
  batch.create(db.collection(COL.modLog).doc(), {
    targetType: "character",
    action: "import",
    actorUid,
    count: drafts.length,
    slugs: drafts.map(({ row }) => row.slug),
    at: FieldValue.serverTimestamp(),
  });

  try {
    await batch.commit();
  } catch (error) {
    if ((error as { code?: number }).code === FIRESTORE_ALREADY_EXISTS) {
      throw new HttpError(
        409,
        "Some characters were added since the preview. Preview again.",
      );
    }
    throw error;
  }
  return { created: drafts.length, items };
}

/** Moves a draft into the ranking. Needs enough verified feats unless an admin forces it. */
export async function publishCharacter(
  actorUid: string,
  slug: string,
  force: boolean,
): Promise<void> {
  const db = adminDb();
  const ref = db.collection(COL.characters).doc(slug);
  const snapshot = await ref.get();
  if (!snapshot.exists) throw new HttpError(404, "Character not found.");
  if (snapshot.get("draft") !== true) {
    throw new HttpError(409, "That character is already published.");
  }

  const verified = Number(snapshot.get("verifiedFeatCount")) || 0;
  const check = canPublish(verified, force);
  if (!check.ok) throw new HttpError(409, check.reason);

  const count = (await db.collection(COL.characters).count().get()).data().count;
  await ref.update({
    draft: FieldValue.delete(),
    rank: count + 1,
    updatedAt: Timestamp.now(),
  });
  await db
    .collection(COL.modLog)
    .doc()
    .create({
      targetType: "character",
      action: "publish",
      actorUid,
      characterId: slug,
      name: String(snapshot.get("name") ?? slug),
      verifiedFeatCount: verified,
      forced: force && verified < PUBLISH.minVerifiedFeats,
      at: FieldValue.serverTimestamp(),
    });

  await rerankAll(db).catch((error) => console.error("rerank failed", error));
}

const PUBLISH_ALL_LIMIT = 1000;
const CHUNK = 400;

/** Moves every draft into the ranking at once, then ranks the field one time */
export async function publishAllDrafts(actorUid: string): Promise<number> {
  const db = adminDb();
  const drafts = await db
    .collection(COL.characters)
    .where("draft", "==", true)
    .select("name")
    .limit(PUBLISH_ALL_LIMIT)
    .get();
  if (drafts.empty) return 0;

  const total = (await db.collection(COL.characters).count().get()).data().count;
  const now = Timestamp.now();
  for (let i = 0; i < drafts.docs.length; i += CHUNK) {
    const batch = db.batch();
    drafts.docs.slice(i, i + CHUNK).forEach((doc, j) => {
      batch.update(doc.ref, {
        draft: FieldValue.delete(),
        rank: total + i + j + 1,
        updatedAt: now,
      });
    });
    await batch.commit();
  }

  await db
    .collection(COL.modLog)
    .doc()
    .create({
      targetType: "character",
      action: "publish-baseline",
      actorUid,
      count: drafts.size,
      slugs: drafts.docs.slice(0, 200).map((doc) => doc.id),
      at: FieldValue.serverTimestamp(),
    });

  await rerankAll(db).catch((error) => console.error("rerank failed", error));
  return drafts.size;
}
