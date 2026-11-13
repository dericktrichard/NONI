import { z } from "zod";

export const topSchema = z.object({ preview: z.boolean().default(false) }).strict();
