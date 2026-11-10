import { z } from "zod";

export const boardsSchema = z.object({ on: z.boolean() }).strict();