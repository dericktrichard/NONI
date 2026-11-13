import { z } from "zod";
import { isAmount } from "@/lib/bank/rules";
import { SLUG_RE } from "@/lib/firebase/paths";

export const contributeSchema = z
  .object({
    slug: z.string().max(80).regex(SLUG_RE),
    amount: z.number().int().refine(isAmount, { message: "Invalid amount." }),
    nonce: z.string().regex(/^[A-Za-z0-9-]{16,64}$/),
  })
  .strict();
