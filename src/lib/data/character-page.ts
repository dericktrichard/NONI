import "server-only";
import type { DocumentData, DocumentReference, QueryDocumentSnapshot } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { COL, SLUG_RE } from "@/lib/firebase/paths";
import type { FeatClaim } from "@/lib/ranking/profile";
import type { MediaType } from "@/types/character";
import type { CharacterPageData, CharacterView, FeatView } from "@/types/character-page";
import type { FeatStatus, PowerProfile, Proof } from "@/types/domain";

const PER_STATUS = 25;

function iso(value: unknown): string {
  const date = (value as { toDate?: () => Date } | null)?.toDate?.();
  return date ? date.toISOString() : "";
}

function toFeat(doc: QueryDocumentSnapshot): FeatView {
  const d = doc.data();
  return {
    id: doc.id,
    title: String(d.title ?? ""),
    description: String(d.description ?? ""),
    claim: d.claim as FeatClaim,
    proofs: (Array.isArray(d.proofs) ? d.proofs : []) as Proof[],
    status: d.status as FeatStatus,
    upvotes: Number(d.upvotes) || 0,
    downvotes: Number(d.downvotes) || 0,
    authorName: String(d.authorName ?? "user"),
    createdAt: iso(d.createdAt),
  };
}

function toCharacter(id: string, d: DocumentData): CharacterView {
  return {
    id,
    name: String(d.name ?? id),
    aliases: Array.isArray(d.aliases) ? d.aliases.map(String) : [],
    verse: String(d.verseName ?? ""),
    verseId: String(d.verseId ?? ""),
    media: d.media as MediaType,
    tags: Array.isArray(d.tags) ? d.tags.map(String) : [],
    imageUrl: typeof d.imageUrl === "string" ? d.imageUrl : null,
    imageCredit: typeof d.imageCredit === "string" ? d.imageCredit : null,
    tier: String(d.tier ?? ""),
    speed: String(d.speed ?? ""),
    score: Number(d.score) || 0,
    rank: typeof d.rank === "number" ? d.rank : null,
    featCount: Number(d.featCount) || 0,
    verifiedFeatCount: Number(d.verifiedFeatCount) || 0,
    evidence: Number(d.evidence) || 0,
    profile: d.profile as PowerProfile,
  };
}

async function featsWith(ref: DocumentReference, status: FeatStatus): Promise<FeatView[]> {
  const snap = await ref
    .collection(COL.feats)
    .where("status", "==", status)
    .orderBy("netScore", "desc")
    .limit(PER_STATUS)
    .get();
  return snap.docs.map(toFeat);
}

export async function fetchCharacterPage(slug: string): Promise<CharacterPageData | null> {
  if (slug.length > 80 || !SLUG_RE.test(slug)) return null;

  const ref = adminDb().collection(COL.characters).doc(slug);
  const [snap, verified, pending] = await Promise.all([
    ref.get(),
    featsWith(ref, "verified"),
    featsWith(ref, "pending"),
  ]);
  if (!snap.exists) return null;

  return { character: toCharacter(snap.id, snap.data() ?? {}), feats: [...verified, ...pending] };
}