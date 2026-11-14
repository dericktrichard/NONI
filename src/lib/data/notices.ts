import "server-only";
import { FieldValue, type Query, type Timestamp } from "firebase-admin/firestore";
import { FIELD as BOARD_FIELD, isOnBoards } from "@/lib/data/standing";
import { adminDb } from "@/lib/firebase/admin";
import { COL } from "@/lib/firebase/paths";
import {
  BOARD_LABEL,
  NOTICE,
  reachedTier,
  takeover,
  type Top,
} from "@/lib/notices/rules";
import { FAN, weekKey } from "@/lib/standing/rules";
import type { BoardKey } from "@/lib/standing/types";

const NOTICES = "notices";
const FANS = "fans";
const KEYS: BoardKey[] = ["glaze", "week", "champions"];
/** A character's No. 1 fan needs at least the lowest tier, so a first battle is not announced */
const MIN_FAN = FAN.tiers[FAN.tiers.length - 1]!.at;

export interface Notice {
  id: string;
  kind: string;
  text: string;
  href: string;
  read: boolean;
  at: number;
}

/** Who held first place before a battle, and where the player stood with each character */
export interface Watch {
  boards: Record<BoardKey, Top | null>;
  fans: Record<string, { top: Top | null; mine: number }>;
}

/** Takes the snapshot before a battle is settled. Null when the player is off the boards or the lookup fails. */
export async function watchBefore(uid: string, slugs: string[]): Promise<Watch | null> {
  try {
    if (!(await isOnBoards(uid))) return null;
    const db = adminDb();
    const week = weekKey(new Date());

    const topUser = async (key: BoardKey): Promise<Top | null> => {
      let query: Query = db.collection(COL.users).where("boards", "==", true);
      if (key === "week") query = query.where("weekKey", "==", week);
      const snap = await query.orderBy(BOARD_FIELD[key], "desc").limit(1).get();
      const doc = snap.docs[0];
      return doc ? { uid: doc.id, value: Number(doc.get(BOARD_FIELD[key])) || 0 } : null;
    };

    const topFan = async (slug: string) => {
      const [top, mine] = await Promise.all([
        db
          .collection(FANS)
          .where("slug", "==", slug)
          .where("boards", "==", true)
          .orderBy("score", "desc")
          .limit(1)
          .get(),
        db.collection(FANS).doc(`${slug}_${uid}`).get(),
      ]);
      const doc = top.docs[0];
      return [
        slug,
        {
          top: doc
            ? { uid: String(doc.get("uid")), value: Number(doc.get("score")) || 0 }
            : null,
          mine: Number(mine.get("score")) || 0,
        },
      ] as const;
    };

    const [glaze, weekly, champions, fans] = await Promise.all([
      topUser("glaze"),
      topUser("week"),
      topUser("champions"),
      Promise.all([...new Set(slugs)].map(topFan)),
    ]);
    return { boards: { glaze, week: weekly, champions }, fans: Object.fromEntries(fans) };
  } catch (error) {
    console.error("watch failed", error);
    return null;
  }
}

/**
 * Compares the player with the snapshot after a battle. Stores a notice for them and for anyone they passed,
 * and returns the player's own lines to show under the verdict.
 */
export async function announce(
  uid: string,
  watch: Watch | null,
  points: Record<string, number>,
): Promise<string[]> {
  if (!watch) return [];
  try {
    const db = adminDb();
    const users = db.collection(COL.users);
    const user = await users.doc(uid).get();
    const handle = user.get("handle");
    if (user.get("boards") !== true || typeof handle !== "string") return [];

    const week = weekKey(new Date());
    const day = new Date().toISOString().slice(0, 10);
    const now: Record<BoardKey, number> = {
      glaze: Number(user.get("glaze")) || 0,
      week: user.get("weekKey") === week ? Number(user.get("weekGlaze")) || 0 : 0,
      champions: Number(user.get("titles")) || 0,
    };

    const mine: Array<{ kind: "gain" | "tier"; text: string; href: string }> = [];
    const lost: Array<{ to: string; id: string; text: string; href: string }> = [];

    for (const key of KEYS) {
      const before = watch.boards[key];
      if (!before) continue;
      const move = takeover(uid, before, now[key]);
      if (!move.gained) continue;
      mine.push({
        kind: "gain",
        text: `You are now No. 1 on ${BOARD_LABEL[key]}.`,
        href: "/leaderboard",
      });
      if (move.overtaken)
        lost.push({
          to: move.overtaken,
          id: `lost-${key}-${day}`,
          text: `@${handle} overtook you as No. 1 on ${BOARD_LABEL[key]}.`,
          href: "/leaderboard",
        });
    }

    const granted = Object.entries(watch.fans).filter(
      ([slug]) => (points[slug] ?? 0) > 0,
    );
    if (granted.length > 0) {
      const characters = await db.getAll(
        ...granted.map(([slug]) => db.collection(COL.characters).doc(slug)),
      );
      granted.forEach(([slug, state], index) => {
        const name = String(characters[index]?.get("name") ?? slug);
        const total = state.mine + (points[slug] ?? 0);
        const href = `/characters/${slug}`;

        const move = takeover(uid, state.top, total, MIN_FAN);
        if (move.gained)
          mine.push({
            kind: "gain",
            text: `You are now the No. 1 fan of ${name}.`,
            href,
          });
        if (move.overtaken)
          lost.push({
            to: move.overtaken,
            id: `lost-fan-${slug}-${day}`,
            text: `@${handle} overtook you as No. 1 fan of ${name}.`,
            href,
          });

        const tier = reachedTier(state.mine, total);
        if (tier)
          mine.push({ kind: "tier", text: `You are now a ${tier} of ${name}.`, href });
      });
    }

    if (mine.length === 0 && lost.length === 0) return [];

    const batch = db.batch();
    const stamp = FieldValue.serverTimestamp();
    for (const notice of mine)
      batch.set(users.doc(uid).collection(NOTICES).doc(), {
        ...notice,
        read: true,
        createdAt: stamp,
      });
    for (const { to, id, text, href } of lost)
      batch.set(users.doc(to).collection(NOTICES).doc(id), {
        kind: "lost",
        text,
        href,
        read: false,
        createdAt: stamp,
      });
    await batch.commit();

    return mine.map((notice) => notice.text);
  } catch (error) {
    console.error("announce failed", error);
    return [];
  }
}

export async function getNotices(
  uid: string,
): Promise<{ items: Notice[]; unread: number }> {
  const snap = await adminDb()
    .collection(COL.users)
    .doc(uid)
    .collection(NOTICES)
    .orderBy("createdAt", "desc")
    .limit(NOTICE.keep)
    .get();

  const items = snap.docs.map((doc): Notice => {
    const stamp = doc.get("createdAt") as Timestamp | undefined;
    return {
      id: doc.id,
      kind: String(doc.get("kind") ?? "gain"),
      text: String(doc.get("text") ?? ""),
      href: String(doc.get("href") ?? "/"),
      read: doc.get("read") === true,
      at: stamp ? stamp.toMillis() : 0,
    };
  });
  return { items, unread: items.filter((item) => !item.read).length };
}

export async function markNoticesRead(uid: string): Promise<void> {
  const db = adminDb();
  const snap = await db
    .collection(COL.users)
    .doc(uid)
    .collection(NOTICES)
    .where("read", "==", false)
    .limit(50)
    .get();
  if (snap.empty) return;
  const batch = db.batch();
  for (const doc of snap.docs) batch.update(doc.ref, { read: true });
  await batch.commit();
}
