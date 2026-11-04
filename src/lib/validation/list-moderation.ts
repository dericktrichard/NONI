import { z } from "zod";
import { LIST_MOD_ACTIONS, LIST_REPORT_REASONS } from "@/lib/lists/moderation";
import { LIST_ID_RE } from "@/lib/validation/list";
import { hasHiddenChars } from "@/lib/validation/text";

const note = z
  .string()
  .trim()
  .max(200)
  .refine((value) => !hasHiddenChars(value), "Invalid characters.");

export const reportListSchema = z
  .object({
    listId: z.string().regex(LIST_ID_RE),
    reason: z.enum(LIST_REPORT_REASONS),
    note,
  })
  .strict();

export const moderateListSchema = z
  .object({
    listId: z.string().regex(LIST_ID_RE),
    action: z.enum(LIST_MOD_ACTIONS),
    note,
  })
  .strict()
  .refine((value) => value.action !== "hide" || value.note.length >= 3, {
    message: "Add a note explaining why.",
    path: ["note"],
  });

export type ReportListInput = z.infer<typeof reportListSchema>;
export type ModerateListInput = z.infer<typeof moderateListSchema>;