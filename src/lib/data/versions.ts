import "server-only";
import { adminDb } from "@/lib/firebase/admin";
import { COL, SLUG_RE } from "@/lib/firebase/paths";
import { isPublished } from "@/lib/import/published";
import type { CharacterSummary } from "@/types/character";
import { SUMMARY_FIELDS, toSummary } from "./summary";

const MAX_VERSIONS = 11;

/**
 * The other versions of a character. Characters saved before versions existed have no
 * entity field, so the entity's own document is read by id as well as by query.
 */
export async function getVersions(
  slug: string,
  entity: string,
): Promise<CharacterSummary[]> {
  if (entity.length > 80 || !SLUG_RE.test(entity)) return [];

  try {
    const db = adminDb();
    const [group, root] = await Promise.all([
      db
        .collection(COL.characters)
        .where("entity", "==", entity)
        .select(...SUMMARY_FIELDS, "draft")
        .limit(MAX_VERSIONS + 1)
        .get(),
      entity === slug ? null : db.collection(COL.characters).doc(entity).get(),
    ]);

    const docs = new Map<string, Record<string, unknown>>();
    for (const doc of group.docs) docs.set(doc.id, doc.data());
    if (root?.exists) docs.set(root.id, root.data() ?? {});
    docs.delete(slug);

    return [...docs]
      .filter(([, data]) => isPublished(data))
      .map(([id, data]) => toSummary(id, data))
      .filter((item): item is CharacterSummary => item !== null)
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_VERSIONS);
  } catch {
    return [];
  }
}
