import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { setBoards } from "@/lib/data/standing";
import { adminDb } from "@/lib/firebase/admin";
import { adminAuth } from "@/lib/firebase/admin-auth";
import { COL } from "@/lib/firebase/paths";

const BATCH = 400;

/**
 * Removes the person. The log entry holds no id, handle or email: profile, handle, Glaze ledger, favourites, lists and sign-in.
 * Feats, arguments and votes stay. They only hold an opaque id and a pseudonym, and the id
 * no longer points to anyone once the account is gone.
 */
export async function deleteAccount(uid: string): Promise<{ handle: string | null }> {
  const db = adminDb();
  const userRef = db.collection(COL.users).doc(uid);
  const user = await userRef.get();
  const stored = user.get("handle");
  const handle = typeof stored === "string" ? stored : null;

  if (handle !== null) await setBoards(uid, false).catch(() => undefined);

  const lists = await db.collection(COL.lists).where("ownerUid", "==", uid).get();
  for (let i = 0; i < lists.docs.length; i += BATCH) {
    const batch = db.batch();
    for (const doc of lists.docs.slice(i, i + BATCH)) batch.delete(doc.ref);
    await batch.commit();
  }

  if (handle !== null) {
    const handleRef = db.collection(COL.handles).doc(handle);
    const owner = await handleRef.get();
    if (owner.exists && owner.get("uid") === uid) await handleRef.delete();
  }

  await db.recursiveDelete(userRef);

  const auth = adminAuth();
  await auth.revokeRefreshTokens(uid).catch(() => undefined);
  await auth.deleteUser(uid).catch((error: { code?: string }) => {
    if (error.code !== "auth/user-not-found") throw error;
  });

  await db
    .collection(COL.modLog)
    .doc()
    .create({
      targetType: "account",
      action: "delete",
      initiator: "self",
      listsDeleted: lists.size,
      at: FieldValue.serverTimestamp(),
    })
    .catch((error) => console.error("account delete log failed", error));

  return { handle };
}
