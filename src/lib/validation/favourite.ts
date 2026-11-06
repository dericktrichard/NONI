import { z } from "zod";

export const favouriteSchema = z
  .object({
    characterId: z.string().regex(/^[A-Za-z0-9_-]{1,128}$/),
    value: z.boolean(),
  })
  .strict();