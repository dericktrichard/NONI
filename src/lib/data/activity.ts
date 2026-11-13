import "server-only";
import { adminDb } from "@/lib/firebase/admin";
import { COL } from "@/lib/firebase/paths";

export interface ActivityStats {
  votes: number | null;
  arguments: number | null;
}

export interface OwnFeat {
  id: string;
  characterId: string;
  characterName: string;
  title: string;
  status: string;
  netScore: number;
  createdAt: string;
}

const SHOWN = 25;

async function countWhere(
  group: string,
  field: string,
  uid: string,
): Promise<number | null> {
  try {
    const snap = await adminDb()
      .collectionGroup(group)
      .where(field, "==", uid)
      .count()
      .get();
    return snap.data().count;
  } catch (error) {
    console.error(`count ${group} failed`, error);
    return null;
  }
}

export async function uidForHandle(handle: string): Promise<string | null> {
  const doc = await adminDb().collection(COL.handles).doc(handle).get();
  const uid = doc.get("uid");
  return typeof uid === "string" ? uid : null;
}

export async function getActivityStats(uid: string): Promise<ActivityStats> {
  const [votes, written] = await Promise.all([
    countWhere(COL.votes, "uid", uid),
    countWhere(COL.arguments, "authorId", uid),
  ]);
  return { votes, arguments: written };
}

export async function listOwnFeats(uid: string): Promise<OwnFeat[]> {
  try {
    const db = adminDb();
    const snap = await db
      .collectionGroup(COL.feats)
      .where("authorId", "==", uid)
      .orderBy("createdAt", "desc")
      .limit(SHOWN)
      .get();

    const ids = [...new Set(snap.docs.map((doc) => String(doc.get("characterId"))))];
    const characters =
      ids.length > 0
        ? await db.getAll(...ids.map((id) => db.collection(COL.characters).doc(id)))
        : [];
    const names = new Map(
      characters.map((c) => [c.id, String(c.get("name") ?? c.id)] as const),
    );

    return snap.docs.map((doc) => {
      const characterId = String(doc.get("characterId"));
      const created = (
        doc.get("createdAt") as { toDate?: () => Date } | undefined
      )?.toDate?.();
      return {
        id: doc.id,
        characterId,
        characterName: names.get(characterId) ?? characterId,
        title: String(doc.get("title") ?? ""),
        status: String(doc.get("status") ?? "pending"),
        netScore: Number(doc.get("netScore")) || 0,
        createdAt: created ? created.toISOString().slice(0, 10) : "",
      };
    });
  } catch (error) {
    console.error("own feats failed", error);
    return [];
  }
}
