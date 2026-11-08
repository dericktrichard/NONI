import "server-only";
import { adminDb } from "@/lib/firebase/admin";
import { COL } from "@/lib/firebase/paths";
import { compileProfile } from "@/lib/ranking/profile";
import type { Entrant } from "@/lib/battle/types";
import type { BattleCard } from "@/lib/battle/view";
import type { PowerProfile } from "@/types/domain";

const POOL_SIZE = 150;
const TTL_MS = 5 * 60_000;
const FIELDS = ["name", "verseName", "score", "rank", "imageUrl", "profile", "verifiedFeatCount"];

export interface Loaded {
  entrant: Entrant;
  card: BattleCard;
}

function parse(slug: string, data: FirebaseFirestore.DocumentData): Loaded | null {
  const profile = data.profile as PowerProfile | undefined;
  if (!profile) return null;
  const name = String(data.name ?? slug);

  try {
    const combat = compileProfile({
      slug,
      name,
      attackPotency: profile.attackPotency,
      durability: profile.durability,
      speed: profile.speed,
      dimension: profile.dimension,
      hax: profile.hax,
      resistances: profile.resistances,
      verifiedFeatCount: Number(data.verifiedFeatCount) || 0,
    });
    const verse = String(data.verseName ?? "");
    return {
      entrant: { profile: combat, verse, score: Number(data.score) || 0 },
      card: {
        slug,
        name,
        verse,
        imageUrl: typeof data.imageUrl === "string" ? data.imageUrl : null,
        rank: typeof data.rank === "number" ? data.rank : null,
      },
    };
  } catch {
    return null;
  }
}

let cache: { at: number; items: Loaded[] } | null = null;

/** The top of the ranking, kept in memory for a few minutes so a battle costs one read at most. */
export async function loadPool(): Promise<Loaded[]> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.items;

  const snap = await adminDb().collection(COL.characters).orderBy("rank", "asc").select(...FIELDS).limit(POOL_SIZE).get();
  const items = snap.docs.map((doc) => parse(doc.id, doc.data())).filter((item): item is Loaded => item !== null);
  cache = { at: Date.now(), items };
  return items;
}

/** The named characters in the given order, or null when any of them is missing */
export async function loadEntrants(slugs: readonly string[]): Promise<Loaded[] | null> {
  const known = new Map((await loadPool()).map((item) => [item.card.slug, item]));
  const missing = [...new Set(slugs.filter((slug) => !known.has(slug)))];

  if (missing.length > 0) {
    const db = adminDb();
    const docs = await db.getAll(...missing.map((slug) => db.collection(COL.characters).doc(slug)), { fieldMask: FIELDS });
    for (const doc of docs) {
      if (!doc.exists) return null;
      const item = parse(doc.id, doc.data() ?? {});
      if (!item) return null;
      known.set(doc.id, item);
    }
  }

  const found = slugs.map((slug) => known.get(slug));
  return found.every((item): item is Loaded => item !== undefined) ? found : null;
}