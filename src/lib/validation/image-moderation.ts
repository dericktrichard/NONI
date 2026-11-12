import { z } from "zod";
import {
  IMAGE_KINDS,
  IMAGE_MOD_ACTIONS,
  IMAGE_REPORT_REASONS,
} from "@/lib/profile/image-moderation";
import { hasHiddenChars } from "@/lib/validation/text";

const UID_RE = /^[A-Za-z0-9_-]{1,128}$/;

const note = z
  .string()
  .trim()
  .max(200)
  .refine((value) => !hasHiddenChars(value), "Invalid characters.");

export const reportImageSchema = z
  .object({
    uid: z.string().regex(UID_RE),
    kind: z.enum(IMAGE_KINDS),
    reason: z.enum(IMAGE_REPORT_REASONS),
    note,
  })
  .strict();

export const moderateImageSchema = z
  .object({
    uid: z.string().regex(UID_RE),
    kind: z.enum(IMAGE_KINDS),
    action: z.enum(IMAGE_MOD_ACTIONS),
    note,
  })
  .strict()
  .refine((value) => value.action === "dismiss" || value.note.length >= 3, {
    message: "Add a note explaining why.",
    path: ["note"],
  });

export type ReportImageInput = z.infer<typeof reportImageSchema>;
export type ModerateImageInput = z.infer<typeof moderateImageSchema>;
