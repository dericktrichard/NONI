import { z } from "zod";

export const deleteAccountSchema = z.object({ confirm: z.literal("DELETE") }).strict();

/** Deleting an account needs a sign-in from the last half hour */
export const FRESH_SIGN_IN_SECONDS = 30 * 60;

export function signedInRecently(authTime: unknown, nowMs: number): boolean {
  return (
    typeof authTime === "number" &&
    Number.isFinite(authTime) &&
    nowMs / 1000 - authTime <= FRESH_SIGN_IN_SECONDS
  );
}
