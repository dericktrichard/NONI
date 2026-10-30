import { z } from "zod";
import {
  MAX_ITEMS,
  MIN_ITEMS,
  REASON_MAX,
  REASON_MIN,
  TITLE_MAX,
  TITLE_MIN,
  hasDuplicates,
} from "@/lib/lists/rules";
import { hasHiddenChars } from "@/lib/validation/text";

export const LIST_ID_RE = /^[A-Za-z0-9]{1,128}$/;
const CHARACTER_ID_RE = /^[A-Za-z0-9_-]{1,128}$/;

const clean = (value: string) => !hasHiddenChars(value);

const itemSchema = z
  .object({
    characterId: z.string().regex(CHARACTER_ID_RE),
    reason: z.string().trim().min(REASON_MIN).max(REASON_MAX).refine(clean, "Invalid characters."),
  })
  .strict();

export const listSchema = z
  .object({
    title: z.string().trim().min(TITLE_MIN).max(TITLE_MAX).refine(clean, "Invalid characters."),
    items: z
      .array(itemSchema)
      .min(MIN_ITEMS)
      .max(MAX_ITEMS)
      .refine((items) => !hasDuplicates(items.map((item) => item.characterId)), "Each character can appear once."),
  })
  .strict();

export const deleteListSchema = z.object({}).strict();

export type ListInput = z.infer<typeof listSchema>;