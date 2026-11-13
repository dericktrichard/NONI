import "server-only";
import { FieldPath } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { COL } from "@/lib/firebase/paths";
import { readLook, type Look } from "@/lib/profile/look";

export interface PersonHit {
  handle: string;
  look: Look;
}

/** Public profiles whose handle starts with the prefix. Private profiles are never returned. */
export async function searchPeople(prefix: string, limit = 8): Promise<PersonHit[]> {
  const db = adminDb();
  const snap = await db
    .collection(COL.handles)
    .orderBy(FieldPath.documentId())
    .startAt(prefix)
    .endAt(`${prefix}\uf8ff`)
    .limit(limit * 2)
    .get();
  if (snap.empty) return [];

  const users = await db.getAll(
    ...snap.docs.map((doc) => db.collection(COL.users).doc(String(doc.get("uid")))),
  );

  return snap.docs
    .flatMap((doc, index) => {
      const user = users[index];
      if (!user?.exists || user.get("handle") !== doc.id || user.get("private") === true)
        return [];
      return [{ handle: doc.id, look: readLook(user.data() ?? {}) }];
    })
    .slice(0, limit);
}
