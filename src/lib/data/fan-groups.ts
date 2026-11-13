import "server-only";
import { memoAsync } from "@/lib/cache/memo";
import { adminDb } from "@/lib/firebase/admin";
import { COL } from "@/lib/firebase/paths";
import { person } from "@/lib/data/standing";
import type { Look } from "@/lib/profile/look";
import { PAGE, type Page } from "@/lib/paging/rules";
import { rankRows, tierOf } from "@/lib/standing/rules";

const FANS = "fans";
const SCAN = 400;
const CHARACTERS = 60;
const PER_CHARACTER = 3;
const KEEP_MS = 60_000;

export interface GroupFan {
  rank: number;
  handle: string;
  look: Look;
  value: number;
  tier: ReturnType<typeof tierOf>;
}

export interface FanGroup {
  slug: string;
  name: string;
  imageUrl: string | null;
  fans: GroupFan[];
}

/** Every character with its biggest fans, ordered by their top fan's score */
async function loadFanGroups(): Promise<FanGroup[]> {
  const db = adminDb();
  const snap = await db
    .collection(FANS)
    .where("boards", "==", true)
    .orderBy("score", "desc")
    .limit(SCAN)
    .get();
  if (snap.empty) return [];

  const bySlug = new Map<string, { uid: string; score: number }[]>();
  for (const doc of snap.docs) {
    const slug = String(doc.get("slug"));
    const entry = { uid: String(doc.get("uid")), score: Number(doc.get("score")) || 0 };
    const list = bySlug.get(slug);
    if (list) list.push(entry);
    else bySlug.set(slug, [entry]);
  }

  const slugs = [...bySlug.keys()].slice(0, CHARACTERS);
  const uids = [
    ...new Set(
      slugs.flatMap((slug) =>
        bySlug
          .get(slug)!
          .slice(0, PER_CHARACTER + 2)
          .map((entry) => entry.uid),
      ),
    ),
  ];
  const [users, characters] = await Promise.all([
    db.getAll(...uids.map((id) => db.collection(COL.users).doc(id))),
    db.getAll(...slugs.map((id) => db.collection(COL.characters).doc(id))),
  ]);
  const people = new Map(users.map((user) => [user.id, person(user)] as const));

  return slugs.flatMap((slug, index) => {
    const character = characters[index];
    if (!character?.exists) return [];

    const entries = bySlug
      .get(slug)!
      .flatMap((entry) => {
        const who = people.get(entry.uid);
        return who ? [{ ...who, value: entry.score }] : [];
      })
      .slice(0, PER_CHARACTER);
    if (entries.length === 0) return [];

    const image = character.get("imageUrl");
    return [
      {
        slug,
        name: String(character.get("name") ?? slug),
        imageUrl: typeof image === "string" ? image : null,
        fans: rankRows(
          entries,
          (entry) => entry.value,
          (entry) => entry.handle,
        ).map((row) => ({
          rank: row.rank,
          handle: row.handle,
          look: row.look,
          value: row.value,
          tier: tierOf(row.value),
        })),
      },
    ];
  });
}

const groups = memoAsync(KEEP_MS, loadFanGroups);

/** One page of characters with their fans. The full list is built once a minute and sliced here. */
export async function getFanPage(
  offset = 0,
  limit = PAGE,
): Promise<Page<FanGroup, number>> {
  try {
    const all = await groups();
    const end = offset + limit;
    return { items: all.slice(offset, end), next: end < all.length ? end : null };
  } catch (error) {
    console.error("fan groups failed", error);
    return { items: [], next: null };
  }
}
