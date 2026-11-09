import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { COL } from "@/lib/firebase/paths";
import { HttpError } from "@/lib/data/feats";
import { GLAZE, dayKey, grantable, type Settlement } from "@/lib/glaze/rules";

const LEDGER = "ledger";

export interface GlazeChange {
  /** Applied change to the balance, negative when a stake was lost */
  change: number;
  balance: number;
  /** Part of a free-play reward was held back by the daily cap */
  capped: boolean;
}

export async function getBalance(uid: string): Promise<number> {
  const snap = await adminDb().collection(COL.users).doc(uid).get();
  const stored = snap.get("glaze");
  return typeof stored === "number" ? stored : GLAZE.start;
}

/**
 * Applies a battle result to the balance in one transaction. The ledger entry is named after
 * `ref`, so repeating the same reference can never pay or charge twice. A stake larger than
 * the balance is refused, and the balance never goes below zero.
 */
export async function settleGlaze(uid: string, settlement: Settlement, stake: number, reason: string, ref: string): Promise<GlazeChange> {
  const db = adminDb();
  const userRef = db.collection(COL.users).doc(uid);
  const entryRef = userRef.collection(LEDGER).doc(ref);
  const today = dayKey(new Date());

  return db.runTransaction(async (tx) => {
    const [user, entry] = await Promise.all([tx.get(userRef), tx.get(entryRef)]);
    const stored = user.get("glaze");
    const balance = typeof stored === "number" ? stored : GLAZE.start;

    if (entry.exists) return { change: 0, balance, capped: false };
    if (stake > balance) throw new HttpError(409, "Not enough Glaze for that stake.");

    const earnedToday = user.get("glazeDay") === today ? Number(user.get("glazeEarned")) || 0 : 0;
    const wanted = settlement.delta;
    const applied = settlement.earned ? grantable(earnedToday, wanted) : wanted;
    const next = Math.max(0, balance + applied);

    tx.set(
      userRef,
      {
        glaze: next,
        ...(settlement.earned ? { glazeDay: today, glazeEarned: earnedToday + applied } : {}),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
    tx.set(entryRef, { amount: next - balance, wanted, stake, reason, balanceAfter: next, createdAt: FieldValue.serverTimestamp() });

    return { change: next - balance, balance: next, capped: settlement.earned && applied < wanted };
  });
}