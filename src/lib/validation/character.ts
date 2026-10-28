import { z } from "zod";
import { HAX_KIND_LIST, type HaxKind } from "@/config/combat";
import { LIMITS } from "@/config/limits";
import { MEDIA_TYPES } from "@/config/media";
import { MAX_DIMENSION, MIN_DIMENSION } from "@/config/scales";
import { SLUG_RE } from "@/lib/firebase/paths";
import { hasHiddenChars } from "@/lib/validation/text";
import type { MediaType } from "@/types/character";

const text = (min: number, max: number) =>
  z
    .string()
    .trim()
    .min(min)
    .max(max)
    .refine((value) => !hasHiddenChars(value), "Invalid characters.");

const tier = z.string().max(8);
const haxKind = z.enum(HAX_KIND_LIST as [HaxKind, ...HaxKind[]]);
const abilities = z.array(z.object({ kind: haxKind, power: tier }).strict()).max(16);

export const createCharacterSchema = z
  .object({
    slug: z.string().max(80).regex(SLUG_RE).optional(),
    name: text(1, 80),
    verse: text(1, 80),
    media: z.enum(MEDIA_TYPES as [MediaType, ...MediaType[]]),
    aliases: z.array(text(1, 80)).max(LIMITS.aliases),
    tags: z.array(text(1, 30)).max(LIMITS.tags),
    attackPotency: tier,
    durability: tier,
    speed: z.string().max(40),
    dimension: z.number().int().min(MIN_DIMENSION).max(MAX_DIMENSION).optional(),
    hax: abilities,
    resistances: abilities,
    imageUrl: z.string().max(2048).nullable(),
    imageCredit: text(1, 200).nullable(),
  })
  .strict();

export type CreateCharacterInput = z.infer<typeof createCharacterSchema>;

export const updateCharacterSchema = createCharacterSchema.omit({ slug: true });

export type UpdateCharacterInput = z.infer<typeof updateCharacterSchema>;