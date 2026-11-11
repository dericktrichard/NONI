import { z } from "zod";
import { BANNER_THEMES } from "@/lib/profile/look";

const CHARACTER_ID_RE = /^[A-Za-z0-9_-]{1,128}$/;

export const lookSchema = z
  .object({
    avatarId: z.string().regex(CHARACTER_ID_RE).nullable(),
    bannerTheme: z.enum(BANNER_THEMES),
    bannerId: z.string().regex(CHARACTER_ID_RE).nullable(),
    avatarUpload: z.boolean().default(false),
    bannerUpload: z.boolean().default(false),
  })
  .strict();

export type LookInput = z.infer<typeof lookSchema>;
