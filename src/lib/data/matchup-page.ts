import "server-only";
import { adminDb } from "@/lib/firebase/admin";
import { COL, SLUG_RE } from "@/lib/firebase/paths";
import { resolveMatchup, type MatchupResult } from "@/lib/ranking/matchup";
import { compileProfile, type CombatProfile, type HaxClaim } from "@/lib/ranking/profile";
import type { PowerProfile } from "@/types/domain";

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
}

export interface CharacterOption {
  slug: string;
  name: string;
  rank: number | null;
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
  const [snapA, snapB] = await db.getAll(
    db.collection(COL.characters).doc(a),
    db.collection(COL.characters).doc(b),
  );
  if (!snapA.exists || !snapB.exists) return null;

  const sideA = load(a, snapA.data() ?? {});
  const sideB = load(b, snapB.data() ?? {});
  if (!sideA || !sideB) return null;

  return { a: sideA.view, b: sideB.view, result: resolveMatchup(sideA.combat, sideB.combat) };
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