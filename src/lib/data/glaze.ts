import "server-only";
import { FieldValue, type DocumentSnapshot } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { COL } from "@/lib/firebase/paths";
import { HttpError } from "@/lib/data/feats";
import {
  GLAZE,
  claimAmount,
  dayKey,
  nextStreak,
  splitSpend,
  type Settlement,
} from "@/lib/glaze/rules";

const LEDGER = "ledger";

export interface GlazeChange {
  /** Applied change to the earned balance, negative when a stake was lost */
  change: number;
  /** Earned plus bought, what the player sees */
  balance: number;
  earned: number;
  /** Always false. Kept until the screens stop reading it. */
  capped: boolean;
}

export interface Wallet {
  /** Stakeable, from play, the daily claim and the starting grant */
  earned: number;
  /** Spend-only, from purchases and premium. Never staked. */
  bought: number;
  total: number;
  /** The streak day the next claim counts as, or today's day once claimed */
  streak: number;
  canClaim: boolean;
  claimAmount: number;
}

const amountOf = (value: unknown, fallback: number): number =>
  typeof value === "number" ? value : fallback;

function readWallet(user: DocumentSnapshot, today: string): Wallet {
  const earned = amountOf(user.get("glaze"), GLAZE.start);
  const bought = amountOf(user.get("bought"), 0);
  const claimed = user.get("glazeClaimDay");
  const streak = nextStreak(
    typeof claimed === "string" ? claimed : null,
    today,
    Number(user.get("glazeStreak")) || 0,
  );
  return {
    earned,
    bought,
    total: earned + bought,
    streak,
    canClaim: claimed !== today,
    claimAmount: claimAmount(streak),
  };
}

export async function getWallet(uid: string): Promise<Wallet> {
  const snap = await adminDb().collection(COL.users).doc(uid).get();
  return readWallet(snap, dayKey(new Date()));
}

export async function getBalance(uid: string): Promise<number> {
  return (await getWallet(uid)).total;
}

/**
 * Applies a battle result to the earned balance in one transaction. The ledger entry is named
 * after `ref`, so repeating the same reference can never pay or charge twice. A stake larger
 * than the earned balance is refused, and the balance never goes below zero.
 */
export async function settleGlaze(
  uid: string,
  settlement: Settlement,
  stake: number,
  reason: string,
  ref: string,
): Promise<GlazeChange> {
  const db = adminDb();
  const userRef = db.collection(COL.users).doc(uid);
  const entryRef = userRef.collection(LEDGER).doc(ref);

  return db.runTransaction(async (tx) => {
    const [user, entry] = await Promise.all([tx.get(userRef), tx.get(entryRef)]);
    const earned = amountOf(user.get("glaze"), GLAZE.start);
    const bought = amountOf(user.get("bought"), 0);
    const unchanged: GlazeChange = {
      change: 0,
      balance: earned + bought,
      earned,
      capped: false,
    };

    if (entry.exists) return unchanged;
    if (stake > earned)
      throw new HttpError(409, "Not enough earned Glaze for that stake.");
    if (settlement.delta === 0) return unchanged;

    const next = Math.max(0, earned + settlement.delta);
    tx.set(
      userRef,
      { glaze: next, updatedAt: FieldValue.serverTimestamp() },
      { merge: true },
    );
    tx.set(entryRef, {
      amount: next - earned,
      wanted: settlement.delta,
      stake,
      reason,
      balanceAfter: next,
      createdAt: FieldValue.serverTimestamp(),
    });

    return { change: next - earned, balance: next + bought, earned: next, capped: false };
  });
}

/** One claim per UTC day. The ledger entry is named after the day, so a retry cannot pay twice. */
export async function claimDaily(
  uid: string,
): Promise<{ amount: number; streak: number; balance: number }> {
  const db = adminDb();
  const userRef = db.collection(COL.users).doc(uid);
  const today = dayKey(new Date());

  return db.runTransaction(async (tx) => {
    const user = await tx.get(userRef);
    if (typeof user.get("handle") !== "string")
      throw new HttpError(409, "Choose a handle first.");

    const created = user.get("createdAt") as { toMillis?: () => number } | undefined;
    const age =
      typeof created?.toMillis === "function"
        ? Date.now() - created.toMillis()
        : Number.POSITIVE_INFINITY;
    if (age < GLAZE.claim.minAgeMs)
      throw new HttpError(409, "Your first daily claim opens a day after you join.");

    const wallet = readWallet(user, today);
    if (!wallet.canClaim)
      throw new HttpError(409, "Already claimed today. Come back tomorrow.");

    const next = wallet.earned + wallet.claimAmount;
    tx.set(
      userRef,
      {
        glaze: next,
        glazeClaimDay: today,
        glazeStreak: wallet.streak,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
    tx.set(userRef.collection(LEDGER).doc(`claim-${today}`), {
      amount: wallet.claimAmount,
      wanted: wallet.claimAmount,
      stake: 0,
      reason: "daily claim",
      balanceAfter: next,
      createdAt: FieldValue.serverTimestamp(),
    });

    return {
      amount: wallet.claimAmount,
      streak: wallet.streak,
      balance: next + wallet.bought,
    };
  });
}

/** Spends Glaze on something that is not a stake. Bought Glaze goes first, then earned. Idempotent by `ref`. */
export async function spendGlaze(
  uid: string,
  amount: number,
  reason: string,
  ref: string,
): Promise<{ balance: number }> {
  const db = adminDb();
  const userRef = db.collection(COL.users).doc(uid);
  const entryRef = userRef.collection(LEDGER).doc(ref);

  return db.runTransaction(async (tx) => {
    const [user, entry] = await Promise.all([tx.get(userRef), tx.get(entryRef)]);
    const earned = amountOf(user.get("glaze"), GLAZE.start);
    const bought = amountOf(user.get("bought"), 0);
    if (entry.exists) return { balance: earned + bought };

    const split = splitSpend(earned, bought, amount);
    if (!split) throw new HttpError(409, "Not enough Glaze.");

    const nextEarned = earned - split.earned;
    const nextBought = bought - split.bought;
    tx.set(
      userRef,
      { glaze: nextEarned, bought: nextBought, updatedAt: FieldValue.serverTimestamp() },
      { merge: true },
    );
    tx.set(entryRef, {
      amount: -amount,
      wanted: -amount,
      stake: 0,
      reason,
      balanceAfter: nextEarned + nextBought,
      createdAt: FieldValue.serverTimestamp(),
    });

    return { balance: nextEarned + nextBought };
  });
}
