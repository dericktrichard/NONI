import { FieldValue, type Firestore } from "firebase-admin/firestore";
import { COL } from "@/lib/firebase/paths";
import { GLAZE } from "@/lib/glaze/rules";
import { PLUS, extendUntil } from "@/lib/plus/rules";

export interface Grant {
  until: number;
  /** The one-time welcome Glaze was added by this grant */
  welcome: boolean;
}

/**
 * Starts or extends Plus. Used by the admin script now and by payments later.
 * The welcome Glaze is added once per account, whatever the number of grants.
 */
export async function grantPlus(
  db: Firestore,
  uid: string,
  days: number,
  now = Date.now(),
): Promise<Grant> {
  const userRef = db.collection(COL.users).doc(uid);
  const entryRef = userRef.collection("ledger").doc("plus-welcome");

  return db.runTransaction(async (tx) => {
    const user = await tx.get(userRef);
    if (!user.exists)
      throw new Error("That account has no profile yet. They must sign in once.");

    const until = extendUntil(user.get("plusUntil"), now, days);
    const welcome = user.get("plusWelcome") !== true;
    const earned =
      typeof user.get("glaze") === "number" ? (user.get("glaze") as number) : GLAZE.start;
    const bought =
      typeof user.get("bought") === "number" ? (user.get("bought") as number) : 0;

    tx.set(
      userRef,
      {
        plusUntil: until,
        ...(welcome ? { plusWelcome: true, bought: bought + PLUS.welcomeBought } : {}),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
    if (welcome)
      tx.set(entryRef, {
        amount: PLUS.welcomeBought,
        wanted: PLUS.welcomeBought,
        stake: 0,
        reason: "plus welcome",
        balanceAfter: earned + bought + PLUS.welcomeBought,
        createdAt: FieldValue.serverTimestamp(),
      });

    return { until, welcome };
  });
}

export async function endPlus(db: Firestore, uid: string): Promise<void> {
  await db.collection(COL.users).doc(uid).set({ plusUntil: 0 }, { merge: true });
}
