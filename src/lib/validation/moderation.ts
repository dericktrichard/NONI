import { z } from "zod";
import { MOD_ACTIONS, REPORT_REASONS, needsNote } from "@/lib/moderation/actions";
import { SLUG_RE } from "@/lib/firebase/paths";
import { ARGUMENT_ID_RE, FEAT_ID_RE } from "@/lib/validation/ids";
import { hasHiddenChars } from "@/lib/validation/text";
import { ARGUMENT_ACTIONS, argumentNeedsNote } from "@/lib/moderation/argument-actions";

const note = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .refine((value) => !hasHiddenChars(value), "Invalid characters.");

const characterId = z.string().max(80).regex(SLUG_RE);

export const reportSchema = z
  .object({
    characterId,
    featId: z.string().regex(FEAT_ID_RE),
    reason: z.enum(REPORT_REASONS),
    note: note(300).optional(),
  })
  .strict();

export const moderateSchema = z
  .object({
    characterId,
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

  const slug = z.string().max(80).regex(SLUG_RE);

export const reportArgumentSchema = z
  .object({
    a: slug,
    b: slug,
    argumentId: z.string().regex(ARGUMENT_ID_RE),
    reason: z.enum(REPORT_REASONS),
    note: note(300).optional(),
  })
  .strict()
  .refine((value) => value.a !== value.b, "A character cannot face itself.");

export const moderateArgumentSchema = z
  .object({
    a: slug,
    b: slug,
    argumentId: z.string().regex(ARGUMENT_ID_RE),
    action: z.enum(ARGUMENT_ACTIONS),
    note: note(500).optional(),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.a === value.b) {
      ctx.addIssue({ code: "custom", path: ["b"], message: "A character cannot face itself." });
    }
    if (argumentNeedsNote(value.action) && (value.note?.length ?? 0) < 5) {
      ctx.addIssue({ code: "custom", path: ["note"], message: "Give a reason." });
    }
  });