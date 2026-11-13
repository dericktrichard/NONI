import "server-only";
import { FieldValue, type Query } from "firebase-admin/firestore";
import { HttpError } from "@/lib/data/feats";
import { adminDb } from "@/lib/firebase/admin";
import { COL } from "@/lib/firebase/paths";
import { GLAZE, dayKey } from "@/lib/glaze/rules";
import { weekKey } from "@/lib/standing/rules";
import { TOP, topReward } from "@/lib/standing/top-reward";

const LEDGER = "ledger";
const FANS = "fans";

export interface TopPreview {
  positions: string[];
  amount: number;
  claimed: boolean;
}

const count = async (query: Query) => (await query.count().get()).data().count;

/** No one is ahead, and enough players are on the board for No. 1 to mean something */
async function leads(
  base: Query,
  field: string,
  value: number,
  participants: Query,
): Promise<boolean> {
  const [ahead, total] = await Promise.all([
    count(base.where(field, ">", value)),
    count(participants),
  ]);
  return ahead === 0 && total >= TOP.minParticipants;
}

/** The No. 1 positions a public player on boards holds right now, as readable labels */
async function findPositions(uid: string): Promise<string[]> {
  const db = adminDb();
  const user = await db.collection(COL.users).doc(uid).get();
  if (
    typeof user.get("handle") !== "string" ||
    user.get("boards") !== true ||
    user.get("private") === true
  )
    return [];

  const week = weekKey(new Date());
  const weekly = user.get("weekKey") === week ? Number(user.get("weekGlaze")) || 0 : 0;
  const titles = Number(user.get("titles")) || 0;
  const everyone = db.collection(COL.users).where("boards", "==", true);

  const mine = await db
    .collection(FANS)
    .where("uid", "==", uid)
    .orderBy("score", "desc")
    .limit(12)
    .get();
  const entries = mine.docs
    .map((doc) => ({
      slug: String(doc.get("slug")),
      score: Number(doc.get("score")) || 0,
      on: doc.get("boards") === true,
    }))
    .filter((entry) => entry.on && entry.score >= TOP.minFanPoints);

  const [fanLead, weekLead, titleLead, characters] = await Promise.all([
    Promise.all(
      entries.map((entry) => {
        const group = db
          .collection(FANS)
          .where("slug", "==", entry.slug)
          .where("boards", "==", true);
        return leads(group, "score", entry.score, group);
      }),
    ),
    weekly > 0
      ? leads(
          everyone.where("weekKey", "==", week),
          "weekGlaze",
          weekly,
          everyone.where("weekKey", "==", week).where("weekGlaze", ">", 0),
        )
      : false,
    titles > 0
      ? leads(everyone, "titles", titles, everyone.where("titles", ">", 0))
      : false,
    entries.length > 0
      ? db.getAll(
          ...entries.map((entry) => db.collection(COL.characters).doc(entry.slug)),
        )
      : [],
  ]);

  const positions: string[] = [];
  entries.forEach((entry, index) => {
    if (fanLead[index])
      positions.push(
        `No. 1 fan of ${String(characters[index]?.get("name") ?? entry.slug)}`,
      );
  });
  if (weekLead) positions.push("No. 1 this week");
  if (titleLead) positions.push("No. 1 in titles");
  return positions;
}

export async function previewTopReward(uid: string): Promise<TopPreview> {
  const db = adminDb();
  const entry = await db
    .collection(COL.users)
    .doc(uid)
    .collection(LEDGER)
    .doc(`top-${dayKey(new Date())}`)
    .get();
  const positions = await findPositions(uid);
  return { positions, amount: topReward(positions.length), claimed: entry.exists };
}

/** One payout per UTC day. The ledger entry is named after the day, so a retry cannot pay twice. */
export async function claimTopReward(
  uid: string,
): Promise<{ amount: number; positions: string[]; balance: number }> {
  const positions = await findPositions(uid);
  const amount = topReward(positions.length);
  if (amount === 0) throw new HttpError(409, "You do not hold a top position right now.");

  const db = adminDb();
  const userRef = db.collection(COL.users).doc(uid);
  const entryRef = userRef.collection(LEDGER).doc(`top-${dayKey(new Date())}`);

  return db.runTransaction(async (tx) => {
    const [user, entry] = await Promise.all([tx.get(userRef), tx.get(entryRef)]);
    if (entry.exists)
      throw new HttpError(409, "Already claimed today. Come back tomorrow.");

    const stored = user.get("glaze");
    const held = user.get("bought");
    const earned = typeof stored === "number" ? stored : GLAZE.start;
    const bought = typeof held === "number" ? held : 0;
    const next = earned + amount;

    tx.set(
      userRef,
      { glaze: next, updatedAt: FieldValue.serverTimestamp() },
      { merge: true },
    );
    tx.set(entryRef, {
      amount,
      wanted: amount,
      stake: 0,
      reason: "top position",
      balanceAfter: next,
      createdAt: FieldValue.serverTimestamp(),
    });
    return { amount, positions, balance: next + bought };
  });
}
