import "server-only";
import { adminDb } from "@/lib/firebase/admin";
import { COL, SLUG_RE } from "@/lib/firebase/paths";

export interface CharacterCardData {
  name: string;
  verse: string;
  tier: string;
  score: number;
  rank: number | null;
  verified: number;
  total: number;
  imageUrl: string | null;
}

export async function fetchCharacterCard(
  slug: string,
): Promise<CharacterCardData | null> {
  if (slug.length > 80 || !SLUG_RE.test(slug)) return null;

  try {
    const doc = await adminDb().collection(COL.characters).doc(slug).get();
    if (!doc.exists) return null;

    const image = doc.get("imageUrl");
    const rank = doc.get("rank");
    return {
      name: String(doc.get("name") ?? slug),
      verse: String(doc.get("verseName") ?? ""),
      tier: String(doc.get("tier") ?? ""),
      score: Number(doc.get("score")) || 0,
      rank: typeof rank === "number" ? rank : null,
      verified: Number(doc.get("verifiedFeatCount")) || 0,
      total: Number(doc.get("featCount")) || 0,
      imageUrl: typeof image === "string" ? image : null,
    };
  } catch (error) {
    console.error("character card read failed", error);
    return null;
  }
}
