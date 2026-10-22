import "server-only";
import { Timestamp } from "firebase-admin/firestore";
import { isApTier, isSpeedLevel } from "@/config/scales";
import { HttpError } from "@/lib/data/feats";
import { rerankAll } from "@/lib/data/rerank";
import { getR2Env } from "@/lib/env.r2";
import { adminDb } from "@/lib/firebase/admin";
import { COL, SLUG_RE } from "@/lib/firebase/paths";
import { buildCharacterDocs } from "@/lib/ranking/character-doc";
import { slugify } from "@/lib/slug";
import type { CreateCharacterInput } from "@/lib/validation/character";

const FIRESTORE_ALREADY_EXISTS = 6;

export async function createCharacter(input: CreateCharacterInput): Promise<string> {
  const slug = input.slug ?? slugify(input.name);
  if (!slug || slug.length > 80 || !SLUG_RE.test(slug)) {
    throw new HttpError(400, "Could not make a valid slug from that name. Set one by hand.");
  }

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