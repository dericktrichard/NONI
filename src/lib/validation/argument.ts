import { z } from "zod";
import { SLUG_RE } from "@/lib/firebase/paths";
import { MAX_CITATIONS } from "@/lib/matchup/arguments";
import { FEAT_ID_RE } from "@/lib/validation/ids";
import { hasHiddenChars } from "@/lib/validation/text";

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