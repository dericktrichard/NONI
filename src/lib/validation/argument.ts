import { z } from "zod";
import { SLUG_RE } from "@/lib/firebase/paths";
import { MAX_CITATIONS } from "@/lib/matchup/arguments";
import { hasHiddenChars } from "@/lib/validation/text";
import { ARGUMENT_ID_RE, FEAT_ID_RE } from "@/lib/validation/ids";

const slug = z.string().max(80).regex(SLUG_RE);

export const argumentSchema = z
  .object({
    a: slug,
    b: slug,
    side: z.enum(["a", "b"]),
    body: z
      .string()
      .trim()
      .min(20)
      .max(1000)
      .refine((value) => !hasHiddenChars(value), "Invalid characters."),
    citations: z
      .array(z.object({ characterId: slug, featId: z.string().regex(FEAT_ID_RE) }).strict())
      .min(1)
      .max(MAX_CITATIONS),
  })
  .strict()
  .refine((value) => value.a !== value.b, "A character cannot face itself.");

export type ArgumentInput = z.infer<typeof argumentSchema>;

export const argumentVoteSchema = z
  .object({
    a: slug,
    b: slug,
    argumentId: z.string().regex(ARGUMENT_ID_RE),
    value: z.union([z.literal(1), z.literal(-1), z.literal(0)]),
  })
  .strict()
  .refine((value) => value.a !== value.b, "A character cannot face itself.");

export type ArgumentVoteInput = z.infer<typeof argumentVoteSchema>;