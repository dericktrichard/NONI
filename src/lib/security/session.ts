import "server-only";
import { cookies } from "next/headers";
import { adminAuth } from "@/lib/firebase/admin-auth";

const production = process.env.NODE_ENV === "production";

export const SESSION_COOKIE = production ? "__Host-noni-session" : "noni-session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 3;
export const RECENT_SIGN_IN_SECONDS = 300;

export const cookieOptions = {
  httpOnly: true,
  secure: production,
  sameSite: "strict" as const,
  path: "/",
};

export async function getSessionUser() {
  const value = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!value) return null;
  try {
    return await adminAuth().verifySessionCookie(value, true);
  } catch {
    return null;
  }
}