import "server-only";
import { FieldValue, type DocumentSnapshot, type Query } from "firebase-admin/firestore";
import { HttpError } from "@/lib/data/feats";
import { adminDb } from "@/lib/firebase/admin";
import { COL } from "@/lib/firebase/paths";
import { GLAZE } from "@/lib/glaze/rules";
import { readLook } from "@/lib/profile/look";
import {
  FAN,
  fanPoints,
  fanTitle,
  rankRows,
  tierOf,
  weekKey,
  type BattleKind,
} from "@/lib/standing/rules";
import type { Badge, BoardKey, BoardRow, Standing } from "@/lib/standing/types";

const FANS = "fans";
const LIMIT = 50;
export const FIELD: Record<BoardKey, string> = {
  glaze: "glaze",
  week: "weekGlaze",
  champions: "titles",
};

export const person = (doc: DocumentSnapshot) => {
  const handle = doc.get("handle");
  return typeof handle === "string" && doc.get("private") !== true
    ? { handle, look: readLook(doc.data() ?? {}) }
    : null;
};

/** Counts one finished battle: stats on the player and fan points for the characters they used */
export async function recordBattle(
  uid: string,
  input: {
    kind: BattleKind;
    slugs: string[];
    won: boolean;
    title: boolean;
    change: number;
    /** Fan points to grant per character, defaults to the full amount */
    points?: Record<string, number>;
  },
): Promise<void> {
  const db = adminDb();
  const userRef = db.collection(COL.users).doc(uid);
  const week = weekKey(new Date());
  const points = input.points ?? fanPoints(input.kind, input.slugs);

  try {
    await db.runTransaction(async (tx) => {
      const user = await tx.get(userRef);
      const boards = user.get("boards") === true;
      tx.set(
        userRef,
        {
          battlesPlayed: FieldValue.increment(1),
          ...(input.won ? { battlesWon: FieldValue.increment(1) } : {}),
          ...(input.title ? { titles: FieldValue.increment(1) } : {}),
          weekKey: week,
          weekGlaze:
            user.get("weekKey") === week
              ? FieldValue.increment(input.change)
              : input.change,
        },
        { merge: true },
      );
      for (const [slug, score] of Object.entries(points)) {
        if (score <= 0) continue;
        tx.set(
          db.collection(FANS).doc(`${slug}_${uid}`),
          {
            slug,
            uid,
            boards,
            score: FieldValue.increment(score),
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true },
        );
      }
    });
  } catch (error) {
    console.error("record battle failed", error);
  }
}

export async function setBoards(uid: string, on: boolean): Promise<void> {
  const db = adminDb();
  const userRef = db.collection(COL.users).doc(uid);
  if (on) {
    const user = await userRef.get();
    if (typeof user.get("handle") !== "string")
      throw new HttpError(409, "Choose a handle first.");
    if (user.get("private") === true)
      throw new HttpError(409, "Make your profile public first.");
  }

  await userRef.set({ boards: on }, { merge: true });
  const fans = await db.collection(FANS).where("uid", "==", uid).get();
  for (let i = 0; i < fans.docs.length; i += 400) {
    const batch = db.batch();
    for (const doc of fans.docs.slice(i, i + 400)) batch.update(doc.ref, { boards: on });
    await batch.commit();
  }
}

export async function isOnBoards(uid: string): Promise<boolean> {
  return (await adminDb().collection(COL.users).doc(uid).get()).get("boards") === true;
}

export async function getBoard(key: BoardKey, limit = LIMIT): Promise<BoardRow[]> {
  try {
    let query: Query = adminDb().collection(COL.users).where("boards", "==", true);
    if (key === "week") query = query.where("weekKey", "==", weekKey(new Date()));
    const snap = await query.orderBy(FIELD[key], "desc").limit(limit).get();

    const rows = snap.docs.flatMap((doc) => {
      const who = person(doc);
      const value = Number(doc.get(FIELD[key])) || 0;
      return who && value > 0 ? [{ ...who, value }] : [];
    });
    return rankRows(
      rows,
      (row) => row.value,
      (row) => row.handle,
    );
  } catch (error) {
    console.error(`board ${key} failed`, error);
    return [];
  }
}

async function fanRows(
  docs: DocumentSnapshot[],
  withCharacter: boolean,
): Promise<BoardRow[]> {
  const db = adminDb();
  const uids = [...new Set(docs.map((doc) => String(doc.get("uid"))))];
  const slugs = withCharacter
    ? [...new Set(docs.map((doc) => String(doc.get("slug"))))]
    : [];
  const [users, characters] = await Promise.all([
    uids.length > 0
      ? db.getAll(...uids.map((id) => db.collection(COL.users).doc(id)))
      : [],
    slugs.length > 0
      ? db.getAll(...slugs.map((id) => db.collection(COL.characters).doc(id)))
      : [],
  ]);
  const people = new Map(users.map((user) => [user.id, person(user)] as const));
  const names = new Map(
    characters.map((c) => [c.id, String(c.get("name") ?? c.id)] as const),
  );

  const rows = docs.flatMap((doc) => {
    const who = people.get(String(doc.get("uid")));
    if (!who) return [];
    const slug = String(doc.get("slug"));
    const value = Number(doc.get("score")) || 0;
    return [
      {
        ...who,
        slug,
        value,
        note: withCharacter ? (names.get(slug) ?? slug) : undefined,
        tier: tierOf(value),
        key: doc.id,
      },
    ];
  });
  return rankRows(
    rows,
    (row) => row.value,
    (row) => row.key,
  );
}

export async function getTopFans(slug: string): Promise<BoardRow[]> {
  try {
    const snap = await adminDb()
      .collection(FANS)
      .where("slug", "==", slug)
      .where("boards", "==", true)
      .orderBy("score", "desc")
      .limit(FAN.top)
      .get();
    return await fanRows(snap.docs, false);
  } catch (error) {
    console.error("top fans failed", error);
    return [];
  }
}

/** A player's fan badges. Hidden players only see their own, as a preview. */
export async function getBadges(uid: string, includeHidden: boolean): Promise<Badge[]> {
  try {
    const db = adminDb();
    if (!includeHidden && !(await isOnBoards(uid))) return [];

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
      }))
      .filter((entry) => tierOf(entry.score) !== null);
    if (entries.length === 0) return [];

    const [characters, ranks] = await Promise.all([
      db.getAll(...entries.map((entry) => db.collection(COL.characters).doc(entry.slug))),
      Promise.all(
        entries.map(async (entry) => {
          const above = db
            .collection(FANS)
            .where("slug", "==", entry.slug)
            .where("boards", "==", true)
            .where("score", ">", entry.score);
          return (await above.count().get()).data().count + 1;
        }),
      ),
    ]);
    const byId = new Map(characters.map((c) => [c.id, c] as const));

    return entries
      .map((entry, index): Badge => {
        const character = byId.get(entry.slug);
        const name = String(character?.get("name") ?? entry.slug);
        const image = character?.get("imageUrl");
        const rank = ranks[index]!;
        return {
          slug: entry.slug,
          name,
          imageUrl: typeof image === "string" ? image : null,
          score: entry.score,
          rank,
          label: fanTitle(name, rank) ?? `${tierOf(entry.score)} of ${name}`,
        };
      })
      .sort((a, b) => a.rank - b.rank || b.score - a.score)
      .slice(0, 6);
  } catch (error) {
    console.error("badges failed", error);
    return [];
  }
}

async function place(key: BoardKey, value: number): Promise<number> {
  let query: Query = adminDb().collection(COL.users).where("boards", "==", true);
  if (key === "week") query = query.where("weekKey", "==", weekKey(new Date()));
  return (await query.where(FIELD[key], ">", value).count().get()).data().count + 1;
}

export async function getMyStanding(uid: string): Promise<Standing> {
  const user = await adminDb().collection(COL.users).doc(uid).get();
  const handle = user.get("handle");
  const boards = user.get("boards") === true;
  const stored = user.get("glaze");
  const values: Record<BoardKey, number> = {
    glaze: typeof stored === "number" ? stored : GLAZE.start,
    week:
      user.get("weekKey") === weekKey(new Date())
        ? Number(user.get("weekGlaze")) || 0
        : 0,
    champions: Number(user.get("titles")) || 0,
  };
  const rank = (key: BoardKey) =>
    boards && values[key] > 0 ? place(key, values[key]) : Promise.resolve(null);
  const [glaze, week, champions] = await Promise.all([
    rank("glaze"),
    rank("week"),
    rank("champions"),
  ]);

  return {
    boards,
    handle: typeof handle === "string" ? handle : null,
    glaze: { value: values.glaze, rank: glaze },
    week: { value: values.week, rank: week },
    champions: { value: values.champions, rank: champions },
  };
}
