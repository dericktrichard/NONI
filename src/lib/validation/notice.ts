import { z } from "zod";
import { hasHiddenChars } from "@/lib/validation/text";

export const NOTICE_LIMITS = { title: 80, body: 600 } as const;

/** Line breaks are allowed in the body, other hidden characters are not */
const clean = (value: string) => !hasHiddenChars(value.replace(/[\r\n]+/g, " "));

export const noticeSchema = z
  .object({
    enabled: z.boolean(),
    title: z
      .string()
      .trim()
      .max(NOTICE_LIMITS.title)
      .refine(clean, "Invalid characters."),
    body: z.string().trim().max(NOTICE_LIMITS.body).refine(clean, "Invalid characters."),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (!value.enabled) return;
    if (value.title.length < 3) {
      ctx.addIssue({ code: "custom", path: ["title"], message: "Add a title." });
    }
    if (value.body.length < 10) {
      ctx.addIssue({ code: "custom", path: ["body"], message: "Add a message." });
    }
  });

export type NoticeInput = z.infer<typeof noticeSchema>;
