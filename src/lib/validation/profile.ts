import { z } from "zod";
import { checkHandle, normalizeHandle } from "@/lib/profile/handle";
import { hasHiddenChars } from "@/lib/validation/text";

export const profileSchema = z
  .object({
    handle: z
      .string()
      .max(40)
      .refine((value) => checkHandle(normalizeHandle(value)) === null, "Choose a valid handle."),
    bio: z
      .string()
      .trim()
      .max(200)
      .refine((value) => !hasHiddenChars(value), "Invalid characters."),
  })
  .strict();

export type ProfileInput = z.infer<typeof profileSchema>;