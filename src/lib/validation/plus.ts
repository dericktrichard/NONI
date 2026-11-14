import { z } from "zod";

export const plusSchema = z.discriminatedUnion("op", [
  z.object({ op: z.literal("state") }).strict(),
  z
    .object({ op: z.literal("banner"), nonce: z.string().regex(/^[A-Za-z0-9-]{16,64}$/) })
    .strict(),
]);
