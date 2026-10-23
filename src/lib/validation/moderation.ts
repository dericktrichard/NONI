import { z } from "zod";
import { MOD_ACTIONS, REPORT_REASONS, needsNote } from "@/lib/moderation/actions";
import { FEAT_ID_RE } from "@/lib/validation/ids";
import { hasHiddenChars } from "@/lib/validation/text";

const note = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .refine((value) => !hasHiddenChars(value), "Invalid characters.");

export const reportSchema = z
  .object({
    featId: z.string().regex(FEAT_ID_RE),
    reason: z.enum(REPORT_REASONS),
    note: note(300).optional(),
  })
  .strict();

export const moderateSchema = z
  .object({
    featId: z.string().regex(FEAT_ID_RE),
    action: z.enum(MOD_ACTIONS),
    note: note(500).optional(),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (needsNote(value.action) && (value.note?.length ?? 0) < 5) {
      ctx.addIssue({ code: "custom", path: ["note"], message: "Give a reason." });
    }
  });