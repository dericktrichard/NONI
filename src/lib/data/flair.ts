import "server-only";
import { FieldValue, type DocumentSnapshot } from "firebase-admin/firestore";
import { HttpError } from "@/lib/data/feats";
import { adminDb } from "@/lib/firebase/admin";
import { COL } from "@/lib/firebase/paths";
import { findFlair, isFrame, isTitle, type FlairKind } from "@/lib/flair/rules";
import { GLAZE, splitSpend } from "@/lib/glaze/rules";

const LEDGER = "ledger";

export interface FlairState {
  owned: string[];
  frame: string | null;
  title: string | null;
  /** Earned plus bought */
  balance: number;
}

const amountOf = (value: unknown, fallback: number): number =>
  typeof value === "number" ? value : fallback;

function read(user: DocumentSnapshot): FlairState {
  const stored: unknown = user.get("flairOwned");
  const frame: unknown = user.get("frame");
  const title: unknown = user.get("flairTitle");
  return {
    owned: Array.isArray(stored)
      ? stored.filter((value): value is string => typeof value === "string")
      : [],
    frame: isFrame(frame) ? frame : null,
    title: isTitle(title) ? title : null,
    balance: amountOf(user.get("glaze"), GLAZE.start) + amountOf(user.get("bought"), 0),
  };
}

export async function getFlair(uid: string): Promise<FlairState> {
  return read(await adminDb().collection(COL.users).doc(uid).get());
}

/**
 * Buys one item in a single transaction. Bought Glaze is spent first. The ledger entry is named after the item,
 * so a retry or double click can never charge twice, and an owned item is never charged again.
 */
export async function buyFlair(uid: string, id: string): Promise<FlairState> {
  const found = findFlair(id);
  if (!found) throw new HttpError(400, "Unknown item.");

  const db = adminDb();
  const userRef = db.collection(COL.users).doc(uid);
  const entryRef = userRef.collection(LEDGER).doc(`flair-${id}`);

  return db.runTransaction(async (tx) => {
    const [user, entry] = await Promise.all([tx.get(userRef), tx.get(entryRef)]);
    if (typeof user.get("handle") !== "string")
      throw new HttpError(409, "Choose a handle first.");

    const state = read(user);
    if (entry.exists || state.owned.includes(id)) return state;

    const earned = amountOf(user.get("glaze"), GLAZE.start);
    const bought = amountOf(user.get("bought"), 0);
    const split = splitSpend(earned, bought, found.price);
    if (!split) throw new HttpError(409, "Not enough Glaze.");

    const nextEarned = earned - split.earned;
    const nextBought = bought - split.bought;
    tx.set(
      userRef,
      {
        glaze: nextEarned,
        bought: nextBought,
        flairOwned: FieldValue.arrayUnion(id),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
    tx.set(entryRef, {
      amount: -found.price,
      wanted: -found.price,
      stake: 0,
      reason: `flair ${id}`,
      balanceAfter: nextEarned + nextBought,
      createdAt: FieldValue.serverTimestamp(),
    });

    return { ...state, owned: [...state.owned, id], balance: nextEarned + nextBought };
  });
}

/** Puts an owned item on the profile. It replaces the frame or title already worn. */
export async function equipFlair(uid: string, id: string): Promise<FlairState> {
  const found = findFlair(id);
  if (!found) throw new HttpError(400, "Unknown item.");

  const userRef = adminDb().collection(COL.users).doc(uid);
  const state = read(await userRef.get());
  if (!state.owned.includes(id)) throw new HttpError(409, "You do not own that yet.");

  await userRef.set(found.kind === "frame" ? { frame: id } : { flairTitle: id }, {
    merge: true,
  });
  return found.kind === "frame" ? { ...state, frame: id } : { ...state, title: id };
}

export async function clearFlair(uid: string, kind: FlairKind): Promise<FlairState> {
  const userRef = adminDb().collection(COL.users).doc(uid);
  await userRef.set(
    { [kind === "frame" ? "frame" : "flairTitle"]: FieldValue.delete() },
    { merge: true },
  );
  return read(await userRef.get());
}
