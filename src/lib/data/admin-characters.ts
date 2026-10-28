import "server-only";
import { Timestamp } from "firebase-admin/firestore";
import { AP_TIERS, apIndex, isApTier, isSpeedLevel } from "@/config/scales";
import { HttpError, recomputeCharacter } from "@/lib/data/feats";
import { rerankAll } from "@/lib/data/rerank";
import { getR2Env } from "@/lib/env.r2";
import { adminDb } from "@/lib/firebase/admin";
import { COL, SLUG_RE } from "@/lib/firebase/paths";
import { buildCharacterDocs } from "@/lib/ranking/character-doc";
import { compileProfile } from "@/lib/ranking/profile";
import { buildSearchKeys } from "@/lib/search-keys";
import { slugify } from "@/lib/slug";
import type { CharacterEditData, CharacterListItem } from "@/types/admin-character";
import type { PowerProfile } from "@/types/domain";
import type { CreateCharacterInput, UpdateCharacterInput } from "@/lib/validation/character";

const FIRESTORE_ALREADY_EXISTS = 6;
const LIST_LIMIT = 500;

function assertCharacterInput(
  input: Pick<CreateCharacterInput, "attackPotency" | "durability" | "speed" | "hax" | "resistances" | "imageUrl">,
): void {
  const abilities = [...input.hax, ...input.resistances];
  if (
    !isApTier(input.attackPotency) ||
    !isApTier(input.durability) ||
    !isSpeedLevel(input.speed) ||
    abilities.some((ability) => !isApTier(ability.power))
  ) {
    throw new HttpError(400, "Choose values from the scales.");
  }

  if (input.imageUrl !== null && !input.imageUrl.startsWith(`${getR2Env().publicUrl}/characters/`)) {
    throw new HttpError(400, "Upload the image through the form.");
  }
}

export async function createCharacter(input: CreateCharacterInput): Promise<string> {
  const slug = input.slug ?? slugify(input.name);
  if (!slug || slug.length > 80 || !SLUG_RE.test(slug)) {
    throw new HttpError(400, "Could not make a valid slug from that name. Set one by hand.");
  }

  assertCharacterInput(input);

  const [doc] = buildCharacterDocs([
    {
      profile: {
        slug,
        name: input.name,
        attackPotency: input.attackPotency,
        durability: input.durability,
        speed: input.speed,
        dimension: input.dimension,
        hax: input.hax,
        resistances: input.resistances,
      },
      verse: input.verse,
      media: input.media,
      featCount: 0,
      aliases: input.aliases,
      tags: input.tags,
    },
  ]);

  const db = adminDb();
  const count = (await db.collection(COL.characters).count().get()).data().count;
  const now = Timestamp.now();

  try {
    await db
      .collection(COL.characters)
      .doc(slug)
      .create({
        ...doc,
        imageUrl: input.imageUrl,
        imageCredit: input.imageCredit,
        rank: count + 1,
        createdAt: now,
        updatedAt: now,
      });
  } catch (error) {
    if ((error as { code?: number }).code === FIRESTORE_ALREADY_EXISTS) {
      throw new HttpError(409, "A character with that slug already exists.");
    }
    throw error;
  }

  await rerankAll(db).catch((error) => console.error("rerank failed", error));
  return slug;
}

export async function updateCharacter(slug: string, input: UpdateCharacterInput): Promise<void> {
  assertCharacterInput(input);

  const db = adminDb();
  const ref = db.collection(COL.characters).doc(slug);
  const snapshot = await ref.get();
  if (!snapshot.exists) throw new HttpError(404, "Character not found.");

  let dimension: number;
  try {
    dimension = compileProfile({
      slug,
      name: input.name,
      attackPotency: input.attackPotency,
      durability: input.durability,
      speed: input.speed,
      dimension: input.dimension,
      hax: input.hax,
      resistances: input.resistances,
    }).dimension;
  } catch {
    throw new HttpError(400, "Those power values do not fit together.");
  }

  const seed: PowerProfile = {
    attackPotency: input.attackPotency,
    durability: input.durability,
    speed: input.speed,
    dimension,
    hax: input.hax.map((ability) => ({ kind: ability.kind, power: ability.power })),
    resistances: input.resistances.map((ability) => ({ kind: ability.kind, power: ability.power })),
  };

  await ref.update({
    name: input.name,
    aliases: input.aliases,
    searchKeys: buildSearchKeys([input.name, ...input.aliases, input.verse]),
    verseId: slugify(input.verse),
    verseName: input.verse,
    media: input.media,
    tags: input.tags,
    seed,
    imageUrl: input.imageUrl,
    imageCredit: input.imageCredit,
    updatedAt: Timestamp.now(),
  });

  await recomputeCharacter(slug);

  const matchups = await db.collection(COL.matchups).where("characterIds", "array-contains", slug).limit(400).get();
  if (!matchups.empty) {
    const batch = db.batch();
    for (const doc of matchups.docs) {
      batch.update(
        doc.ref,
        doc.get("characterAId") === slug
          ? { aName: input.name, aImageUrl: input.imageUrl }
          : { bName: input.name, bImageUrl: input.imageUrl },
      );
    }
    await batch.commit();
  }

  await rerankAll(db).catch((error) => console.error("rerank failed", error));
}

export async function listCharacters(): Promise<CharacterListItem[]> {
  const snapshot = await adminDb()
    .collection(COL.characters)
    .select("name", "verseName", "rank", "tier", "featCount", "verifiedFeatCount")
    .limit(LIST_LIMIT)
    .get();

  return snapshot.docs
    .map((doc) => ({
      slug: doc.id,
      name: String(doc.get("name") ?? doc.id),
      verse: String(doc.get("verseName") ?? ""),
      rank: typeof doc.get("rank") === "number" ? (doc.get("rank") as number) : null,
      tier: String(doc.get("tier") ?? ""),
      featCount: Number(doc.get("featCount")) || 0,
      verifiedFeatCount: Number(doc.get("verifiedFeatCount")) || 0,
    }))
    .sort((x, y) => {
      if (x.rank !== null && y.rank !== null) return x.rank - y.rank;
      if (x.rank !== null) return -1;
      if (y.rank !== null) return 1;
      return x.name.localeCompare(y.name);
    });
}

function impliedDimension(attackPotency: string, durability: string): number | null {
  try {
    return Math.max(AP_TIERS[apIndex(attackPotency)].dimension, AP_TIERS[apIndex(durability)].dimension);
  } catch {
    return null;
  }
}

export async function getCharacterForEdit(slug: string): Promise<CharacterEditData | null> {
  if (slug.length > 80 || !SLUG_RE.test(slug)) return null;

  const snapshot = await adminDb().collection(COL.characters).doc(slug).get();
  if (!snapshot.exists) return null;

  const seed = snapshot.get("seed") as PowerProfile | undefined;
  if (!seed) return null;

  const implied = impliedDimension(seed.attackPotency, seed.durability);

  return {
    slug,
    name: String(snapshot.get("name") ?? slug),
    verse: String(snapshot.get("verseName") ?? ""),
    media: snapshot.get("media"),
    aliases: (snapshot.get("aliases") as string[] | undefined) ?? [],
    tags: (snapshot.get("tags") as string[] | undefined) ?? [],
    attackPotency: seed.attackPotency,
    durability: seed.durability,
    speed: seed.speed,
    dimension: seed.dimension === implied ? 0 : seed.dimension,
    hax: seed.hax ?? [],
    resistances: seed.resistances ?? [],
    imageUrl: typeof snapshot.get("imageUrl") === "string" ? snapshot.get("imageUrl") : null,
    imageCredit: typeof snapshot.get("imageCredit") === "string" ? snapshot.get("imageCredit") : null,
  };
}