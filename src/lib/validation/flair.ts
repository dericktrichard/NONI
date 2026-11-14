import { z } from "zod";
import { findFlair } from "@/lib/flair/rules";

const item = z
  .string()
  .max(40)
  .refine((value) => findFlair(value) !== null, { message: "Unknown item." });

export const flairSchema = z.discriminatedUnion("op", [
  z.object({ op: z.literal("state") }).strict(),
  z.object({ op: z.literal("buy"), id: item }).strict(),
  z.object({ op: z.literal("equip"), id: item }).strict(),
  z.object({ op: z.literal("clear"), kind: z.enum(["frame", "title"]) }).strict(),
]);
