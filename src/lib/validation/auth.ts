import { z } from "zod";

export const emailSchema = z.string().trim().toLowerCase().email().max(254);

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(128),
});

export const signUpSchema = z.object({
  email: emailSchema,
  password: z.string().min(10).max(128),
});