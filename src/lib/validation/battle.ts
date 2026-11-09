import { z } from "zod";
import { SLUG_RE } from "@/lib/firebase/paths";
import { isStake } from "@/lib/glaze/rules";

const slug = z.string().max(80).regex(SLUG_RE);
const team = z.array(slug).min(1).max(5);
const difficulty = z.enum(["fair", "hard"]);
const stake = z.number().int().refine(isStake, { message: "Invalid stake." }).default(0);

export const teamSuggestSchema = z
  .object({
    mode: z.enum(["random", "counter"]),
    size: z.number().int().min(1).max(5),
    against: z.array(slug).max(5).default([]),
    exclude: z.array(slug).max(10).default([]),
    difficulty: difficulty.default("fair"),
  })
  .strict()
  .refine((value) => value.mode !== "counter" || value.against.length > 0, { message: "Choose the team to counter." });

export const clashSchema = z.object({ teamA: team, teamB: team, stake }).strict();

export const climbSchema = z
  .object({
    hero: slug,
    size: z.union([z.literal(8), z.literal(16)]),
    mode: z.enum(["counters", "random"]),
    difficulty,
    stake,
  })
  .strict();