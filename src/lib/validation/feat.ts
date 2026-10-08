import { z } from "zod";
import { HAX_KIND_LIST, type HaxKind } from "@/config/combat";
import { LIMITS } from "@/config/limits";
import { PROOF } from "@/config/ranking";
import { SLUG_RE } from "@/lib/firebase/paths";
import { hasHiddenChars } from "@/lib/validation/text";

const clean = (value: string) => !hasHiddenChars(value);

const text = (min: number, max: number) => z.string().trim().min(min).max(max).refine(clean, "Invalid characters.");

const slug = z.string().max(80).regex(SLUG_RE);
const haxKind = z.enum(HAX_KIND_LIST as [HaxKind, ...HaxKind[]]);
const tier = z.string().max(8);

const claimSchema = z.discriminatedUnion("category", [
  z.object({ category: z.literal("attackPotency"), tier }).strict(),
  z.object({ category: z.literal("durability"), tier }).strict(),
  z.object({ category: z.literal("speed"), level: z.string().max(40) }).strict(),
  z.object({ category: z.literal("dimension"), dimension: z.number().int() }).strict(),
  z.object({ category: z.literal("hax"), kind: haxKind, power: tier }).strict(),
  z.object({ category: z.literal("resistance"), kind: haxKind, power: tier }).strict(),
]);

const proofSchema = z
  .object({
    type: z.enum(["panel", "video", "quote", "official"]),
    url: z.string().trim().max(PROOF.maxUrlLength),
    locator: z.string().trim().max(LIMITS.proofLocator).refine(clean, "Invalid characters."),
    excerpt: z.string().trim().max(LIMITS.proofExcerpt).refine(clean, "Invalid characters.").optional(),
  })
  .strict();

export const submitFeatSchema = z
  .object({
    characterId: slug,
    title: text(3, LIMITS.featTitle),
    description: text(10, LIMITS.featDescription),
    claim: claimSchema,
    proofs: z.array(proofSchema).max(LIMITS.proofsPerFeat),
  })
  .strict();

export const voteSchema = z
  .object({
    characterId: slug,
    featId: z.string().regex(/^[A-Za-z0-9]{20}$/),
    value: z.union([z.literal(1), z.literal(-1), z.literal(0)]),
  })
  .strict();

export type SubmitFeatInput = z.infer<typeof submitFeatSchema>;
export type VoteInput = z.infer<typeof voteSchema>;