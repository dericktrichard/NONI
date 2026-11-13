import "server-only";
import { createHash } from "node:crypto";
import { cookies } from "next/headers";
import { adminAuth } from "@/lib/firebase/admin-auth";
import { createTrust, isRejection, within } from "@/lib/security/session-check";

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

type Decoded = Awaited<ReturnType<ReturnType<typeof adminAuth>["verifySessionCookie"]>>;

export type Session =
  | { status: "user"; user: Decoded }
  | { status: "none" }
  /** The check could not finish. This says nothing about whether the user is signed in. */
  | { status: "unavailable" };

/**
 * strict: always a fresh full check, for staff actions. Never uses the cache or the fallback.
 * normal: reuses a recent full check, and falls back to signature and expiry when the revocation lookup is slow.
 * local: signature and expiry only.
 */
export type SessionMode = "strict" | "normal" | "local";

const CHECK_TIMEOUT_MS = 4_000;
const TRUST_MS = 60_000;
const BACKOFF_MS = 60_000;

const trusted = createTrust<Decoded>(TRUST_MS, 500);
let blindUntil = 0;

const digest = (value: string) => createHash("sha256").update(value).digest("hex");

export async function readSession(mode: SessionMode = "normal"): Promise<Session> {
  const value = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!value) return { status: "none" };

  const key = digest(value);
  const auth = adminAuth();

  if (mode !== "local") {
    if (mode === "normal") {
      const hit = trusted.get(key);
      if (hit) return { status: "user", user: hit };
    }

    if (mode === "strict" || Date.now() >= blindUntil) {
      try {
        const user = await within(
          CHECK_TIMEOUT_MS,
          auth.verifySessionCookie(value, true),
        );
        trusted.set(key, user, user.exp * 1000);
        return { status: "user", user };
      } catch (error) {
        if (isRejection(error)) {
          trusted.delete(key);
          return { status: "none" };
        }
        blindUntil = Date.now() + BACKOFF_MS;
        console.error(
          "session revocation check unavailable",
          (error as { code?: string }).code ?? error,
        );
      }
    }
    if (mode === "strict") return { status: "unavailable" };
  }

  try {
    return {
      status: "user",
      user: await within(CHECK_TIMEOUT_MS, auth.verifySessionCookie(value, false)),
    };
  } catch (error) {
    return isRejection(error) ? { status: "none" } : { status: "unavailable" };
  }
}

/** The signed-in user, or null. A check that could not finish counts as null here, so pages stay simple. */
export async function getSessionUser(checkRevoked = true) {
  const session = await readSession(checkRevoked ? "normal" : "local");
  return session.status === "user" ? session.user : null;
}
