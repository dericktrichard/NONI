import { z } from "zod";
import { SLUG_RE } from "@/lib/firebase/paths";

const slug = z.string().max(80).regex(SLUG_RE);

export const matchupVoteSchema = z
  .object({
    a: slug,
    b: slug,
    pick: z.enum(["a", "b", "none"]),
  })
  .strict()
  .refine((value) => value.a !== value.b, "A character cannot face itself.");

export type MatchupVoteInput = z.infer<typeof matchupVoteSchema>;