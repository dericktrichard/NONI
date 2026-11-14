import { z } from "zod";

export const noticesSchema = z.object({ markRead: z.boolean().default(false) }).strict();
