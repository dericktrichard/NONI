import "server-only";
import { FieldValue, type Query } from "firebase-admin/firestore";
import { BANK, weekTotalAfter } from "@/lib/bank/rules";
import { memoAsync } from "@/lib/cache/memo";
import { HttpError } from "@/lib/data/feats";
import { person } from "@/lib/data/standing";
import { adminDb } from "@/lib/firebase/admin";
import { COL } from "@/lib/firebase/paths";
import { GLAZE, splitSpend } from "@/lib/glaze/rules";
import { PAGE, type Page } from "@/lib/paging/rules";
import { rankRows, weekKey } from "@/lib/standing/rules";
import type { BoardRow } from "@/lib/standing/types";

const LEDGER = "ledger";
const CONTRIBUTORS = "contributors";
const MAX_BANKS = 60;
const KEEP_MS = 60_000;

export type BankKind = "all" | "week";

export interface BankRow {
  rank: number;
  slug: string;
  name: string;
  imageUrl: string | null;
  value: number;
}

export interface BankInfo {
  total: number;
  weekTotal: number;
  /** Place among all banks, null while the bank is empty */
  rank: number | null;
  contributors: BoardRow[];
}

const amountOf = (value: unknown, fallback: number): number =>
  typeof value === "number" ? value : fallback;

/**
 * Moves Glaze from a player into a character's bank in one transaction. Bought Glaze is spent first.
 * The ledger entry is named after `nonce`, so repeating the same request can never charge twice.
 */
export async function contribute(
  uid: string,
  slug: string,
  amount: number,
  nonce: string,
): Promise<{ balance: number; total: number }> {
  const db = adminDb();
  const character = await db.collection(COL.characters).doc(slug).get();
  if (!character.exists) throw new HttpError(404, "Character not found.");

  const userRef = db.collection(COL.users).doc(uid);
  const bankRef = db.collection(COL.banks).doc(slug);
  const contributorRef = bankRef.collection(CONTRIBUTORS).doc(uid);
  const entryRef = userRef.collection(LEDGER).doc(`bank-${nonce}`);
  const week = weekKey(new Date());

  return db.runTransaction(async (tx) => {
    const [user, entry, bank, contributor] = await Promise.all([
      tx.get(userRef),
      tx.get(entryRef),
      tx.get(bankRef),
      tx.get(contributorRef),
    ]);
    const earned = amountOf(user.get("glaze"), GLAZE.start);
    const bought = amountOf(user.get("bought"), 0);
    const held = Number(bank.get("total")) || 0;

    if (entry.exists) return { balance: earned + bought, total: held };

    const split = splitSpend(earned, bought, amount);
    if (!split) throw new HttpError(409, "Not enough Glaze.");

    const nextEarned = earned - split.earned;
    const nextBought = bought - split.bought;
    const total = held + amount;

    tx.set(
      userRef,
      { glaze: nextEarned, bought: nextBought, updatedAt: FieldValue.serverTimestamp() },
      { merge: true },
    );
    tx.set(entryRef, {
      amount: -amount,
      wanted: -amount,
      stake: 0,
      reason: `bank ${slug}`,
      balanceAfter: nextEarned + nextBought,
      createdAt: FieldValue.serverTimestamp(),
    });
    tx.set(
      bankRef,
      {
        slug,
        total,
        weekKey: week,
        weekTotal: weekTotalAfter(
          { weekKey: bank.get("weekKey"), weekTotal: bank.get("weekTotal") },
          week,
          amount,
        ),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
    tx.set(
      contributorRef,
      {
        uid,
        total: (Number(contributor.get("total")) || 0) + amount,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    return { balance: nextEarned + nextBought, total };
  });
}

/** One character's bank: totals, place, and the biggest contributors who are public players on boards */
export async function getBank(slug: string): Promise<BankInfo> {
  try {
    const db = adminDb();
    const ref = db.collection(COL.banks).doc(slug);
    const [bank, top] = await Promise.all([
      ref.get(),
      ref.collection(CONTRIBUTORS).orderBy("total", "desc").limit(20).get(),
    ]);

    const total = Number(bank.get("total")) || 0;
    const weekTotal =
      bank.get("weekKey") === weekKey(new Date())
        ? Number(bank.get("weekTotal")) || 0
        : 0;
    const rank =
      total > 0
        ? (await db.collection(COL.banks).where("total", ">", total).count().get()).data()
            .count + 1
        : null;

    const users =
      top.docs.length > 0
        ? await db.getAll(...top.docs.map((doc) => db.collection(COL.users).doc(doc.id)))
        : [];
    const byUid = new Map(users.map((user) => [user.id, user] as const));

    const rows = top.docs.flatMap((doc) => {
      const user = byUid.get(doc.id);
      const who = user && user.get("boards") === true ? person(user) : null;
      const value = Number(doc.get("total")) || 0;
      return who && value > 0 ? [{ ...who, value }] : [];
    });

    return {
      total,
      weekTotal,
      rank,
      contributors: rankRows(
        rows,
        (row) => row.value,
        (row) => row.handle,
      ).slice(0, BANK.named),
    };
  } catch (error) {
    console.error("bank failed", error);
    return { total: 0, weekTotal: 0, rank: null, contributors: [] };
  }
}

async function loadBanks(kind: BankKind): Promise<BankRow[]> {
  const db = adminDb();
  let query: Query = db.collection(COL.banks);
  if (kind === "week") query = query.where("weekKey", "==", weekKey(new Date()));
  const snap = await query
    .orderBy(kind === "week" ? "weekTotal" : "total", "desc")
    .limit(MAX_BANKS)
    .get();

  const entries = snap.docs
    .map((doc) => ({
      slug: doc.id,
      value: Number(doc.get(kind === "week" ? "weekTotal" : "total")) || 0,
    }))
    .filter((entry) => entry.value > 0);
  if (entries.length === 0) return [];

  const characters = await db.getAll(
    ...entries.map((entry) => db.collection(COL.characters).doc(entry.slug)),
  );
  const rows = entries.flatMap((entry, index) => {
    const character = characters[index];
    if (!character?.exists) return [];
    const image = character.get("imageUrl");
    return [
      {
        slug: entry.slug,
        name: String(character.get("name") ?? entry.slug),
        imageUrl: typeof image === "string" ? image : null,
        value: entry.value,
      },
    ];
  });

  return rankRows(
    rows,
    (row) => row.value,
    (row) => row.slug,
  );
}

const lists: Record<BankKind, () => Promise<BankRow[]>> = {
  all: memoAsync(KEEP_MS, () => loadBanks("all")),
  week: memoAsync(KEEP_MS, () => loadBanks("week")),
};

/** One page of the Richest Characters board. The list is built once a minute and sliced here. */
export async function getBankPage(
  kind: BankKind,
  offset = 0,
  limit = PAGE,
): Promise<Page<BankRow, number>> {
  try {
    const all = await lists[kind]();
    const end = offset + limit;
    return { items: all.slice(offset, end), next: end < all.length ? end : null };
  } catch (error) {
    console.error("bank page failed", error);
    return { items: [], next: null };
  }
}
