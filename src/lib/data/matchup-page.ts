import "server-only";
import { adminDb } from "@/lib/firebase/admin";
import { resolveMatchup, type MatchupResult } from "@/lib/ranking/matchup";
import { compileProfile, type CombatProfile, type HaxClaim } from "@/lib/ranking/profile";
import type { PowerProfile } from "@/types/domain";
import { COL, SLUG_RE, matchupId } from "@/lib/firebase/paths";
import { orderPair, toViewPick, toViewTally, type ViewTally } from "@/lib/matchup/vote";

export interface MatchupSideView {
  slug: string;
  name: string;
  verse: string;
  imageUrl: string | null;
  imageCredit: string | null;
  tier: string;
  rank: number | null;
  featCount: number;
  verifiedFeatCount: number;
  attackPotency: string;
  durability: string;
  speed: string;
  dimension: number;
  hax: HaxClaim[];
  resistances: HaxClaim[];
}

export interface MatchupPageData {
  a: MatchupSideView;
  b: MatchupSideView;
  result: MatchupResult;
  community: ViewTally;
  arguments: ArgumentView[];
  citable: CitableFeat[];
}

export interface CharacterOption {
  slug: string;
  name: string;
  rank: number | null;
}

export interface ArgumentView {
  id: string;
  side: "a" | "b";
  authorName: string;
  body: string;
  upvotes: number;
  downvotes: number;
  citations: Array<{ characterId: string; featId: string; title: string }>;
  createdAt: string;
}

export interface CitableFeat {
  characterId: string;
  characterName: string;
  featId: string;
  title: string;
}

const ARGUMENT_LIMIT = 20;
const CITABLE_LIMIT = 25;

async function fetchCitable(characterId: string, characterName: string): Promise<CitableFeat[]> {
  const snap = await adminDb()
    .collection(COL.characters)
    .doc(characterId)
    .collection(COL.feats)
    .where("status", "==", "verified")
    .orderBy("netScore", "desc")
    .limit(CITABLE_LIMIT)
    .get();

  return snap.docs.map((doc) => ({
    characterId,
    characterName,
    featId: doc.id,
    title: String(doc.get("title") ?? ""),
  }));
}

async function fetchArguments(a: string, b: string): Promise<ArgumentView[]> {
  const { flipped } = orderPair(a, b);

  try {
    const snap = await adminDb()
      .collection(COL.matchups)
      .doc(matchupId(a, b))
      .collection(COL.arguments)
      .where("status", "==", "visible")
      .orderBy("netScore", "desc")
      .limit(ARGUMENT_LIMIT)
      .get();

    const views: ArgumentView[] = [];
    for (const doc of snap.docs) {
      const stored = doc.get("side");
      const side = toViewPick(stored === "a" || stored === "b" ? stored : null, flipped);
      if (side === "none") continue;

      const created = doc.get("createdAt");
      const citations: unknown = doc.get("citations");
      views.push({
        id: doc.id,
        side,
        authorName: String(doc.get("authorName") ?? ""),
        body: String(doc.get("body") ?? ""),
        upvotes: Number(doc.get("upvotes")) || 0,
        downvotes: Number(doc.get("downvotes")) || 0,
        citations: Array.isArray(citations)
          ? citations.map((item) => ({
              characterId: String(item?.characterId ?? ""),
              featId: String(item?.featId ?? ""),
              title: String(item?.title ?? ""),
            }))
          : [],
        createdAt: created?.toDate ? created.toDate().toISOString() : "",
      });
    }
    return views;
  } catch (error) {
    console.error("arguments query failed", error);
    return [];
  }
}

function load(slug: string, data: FirebaseFirestore.DocumentData): { combat: CombatProfile; view: MatchupSideView } | null {
  const profile = data.profile as PowerProfile | undefined;
  if (!profile) return null;

  const name = String(data.name ?? slug);
  const verifiedFeatCount = Number(data.verifiedFeatCount) || 0;

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
      verifiedFeatCount,
    });

    return {
      combat,
      view: {
        slug,
        name,
        verse: String(data.verseName ?? ""),
        imageUrl: typeof data.imageUrl === "string" ? data.imageUrl : null,
        imageCredit: typeof data.imageCredit === "string" ? data.imageCredit : null,
        tier: String(data.tier ?? profile.attackPotency),
        rank: typeof data.rank === "number" ? data.rank : null,
        featCount: Number(data.featCount) || 0,
        verifiedFeatCount,
        attackPotency: profile.attackPotency,
        durability: profile.durability,
        speed: profile.speed,
        dimension: combat.dimension,
        hax: profile.hax ?? [],
        resistances: profile.resistances ?? [],
      },
    };
  } catch {
    return null;
  }
}

export async function fetchMatchupPage(a: string, b: string): Promise<MatchupPageData | null> {
  for (const slug of [a, b]) {
    if (slug.length > 80 || !SLUG_RE.test(slug)) return null;
  }
  if (a === b) return null;

  const db = adminDb();
  const [snapA, snapB, matchup] = await db.getAll(
    db.collection(COL.characters).doc(a),
    db.collection(COL.characters).doc(b),
    db.collection(COL.matchups).doc(matchupId(a, b)),
  );
  if (!snapA.exists || !snapB.exists) return null;

  const sideA = load(a, snapA.data() ?? {});
  const sideB = load(b, snapB.data() ?? {});
  if (!sideA || !sideB) return null;

  const { flipped } = orderPair(a, b);
  const community = toViewTally(
    { votesA: Number(matchup.get("votesA")) || 0, votesB: Number(matchup.get("votesB")) || 0 },
    flipped,
  );

  const [arguments_, citableA, citableB] = await Promise.all([
    fetchArguments(a, b),
    fetchCitable(a, sideA.view.name),
    fetchCitable(b, sideB.view.name),
  ]);

  return {
    a: sideA.view,
    b: sideB.view,
    result: resolveMatchup(sideA.combat, sideB.combat),
    community,
    arguments: arguments_,
    citable: [...citableA, ...citableB],
  };
}

export async function fetchCharacterOptions(): Promise<CharacterOption[]> {
  const snap = await adminDb().collection(COL.characters).select("name", "rank").limit(500).get();

  return snap.docs
    .map((doc) => ({
      slug: doc.id,
      name: String(doc.get("name") ?? doc.id),
      rank: typeof doc.get("rank") === "number" ? (doc.get("rank") as number) : null,
    }))
    .sort((x, y) => {
      if (x.rank !== null && y.rank !== null) return x.rank - y.rank;
      if (x.rank !== null) return -1;
      if (y.rank !== null) return 1;
      return x.name.localeCompare(y.name);
    });
}