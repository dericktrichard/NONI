import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { COL } from "@/lib/firebase/paths";
import { GLAZE, dayKey, grantable } from "@/lib/glaze/rules";

const LEDGER = "ledger";

export interface GlazeGrant {
  granted: number;
  balance: number;
  /** Part or all of the reward was held back by the daily cap */
  capped: boolean;
}

export async function getBalance(uid: string): Promise<number> {
  const snap = await adminDb().collection(COL.users).doc(uid).get();
  const stored = snap.get("glaze");
  return typeof stored === "number" ? stored : GLAZE.start;
}

/**
 * Adds earned Glaze under the daily cap. The ledger entry is named after `ref`, so
 * repeating the same reference can never pay twice.
 */
export async function grantGlaze(uid: string, amount: number, reason: string, ref: string): Promise<GlazeGrant> {
  const db = adminDb();
  const userRef = db.collection(COL.users).doc(uid);
  const entryRef = userRef.collection(LEDGER).doc(ref);
  const today = dayKey(new Date());

  return db.runTransaction(async (tx) => {
    const [user, entry] = await Promise.all([tx.get(userRef), tx.get(entryRef)]);
    const stored = user.get("glaze");
    const balance = typeof stored === "number" ? stored : GLAZE.start;

    if (entry.exists) return { granted: 0, balance, capped: false };

    const earnedToday = user.get("glazeDay") === today ? Number(user.get("glazeEarned")) || 0 : 0;
    const granted = grantable(earnedToday, amount);
    const next = balance + granted;

    tx.set(
      userRef,
      { glaze: next, glazeDay: today, glazeEarned: earnedToday + granted, updatedAt: FieldValue.serverTimestamp() },
      { merge: true },
    );
    tx.set(entryRef, { amount: granted, wanted: amount, reason, balanceAfter: next, createdAt: FieldValue.serverTimestamp() });

    return { granted, balance: next, capped: granted < amount };
  });
}