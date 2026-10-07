import { NextResponse } from "next/server";
import { Timestamp } from "firebase-admin/firestore";
import { z } from "zod";
import { adminDb } from "@/lib/firebase/admin";
import { adminAuth } from "@/lib/firebase/admin-auth";
import { COL } from "@/lib/firebase/paths";
import { getClientIp } from "@/lib/security/client-ip";
import { isSameOrigin } from "@/lib/security/origin";
import { createMemoryLimiter } from "@/lib/security/rate-limit-core";
import {
  RECENT_SIGN_IN_SECONDS,
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  cookieOptions,
} from "@/lib/security/session";

export const runtime = "nodejs";

const MAX_BODY_BYTES = 8192;
const FIRESTORE_ALREADY_EXISTS = 6;
const attempts = createMemoryLimiter(20, 10 * 60_000);
const Body = z.object({ idToken: z.string().min(100).max(4096) }).strict();

const reply = (status: number, error?: string, retryAfter?: number) => {
  const headers: Record<string, string> = { "Cache-Control": "no-store" };
  if (retryAfter) headers["Retry-After"] = String(retryAfter);
  return NextResponse.json(error ? { error } : { ok: true }, { status, headers });
};

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return reply(403, "Forbidden.");

  const gate = attempts(getClientIp(request));
  if (!gate.allowed) return reply(429, "Too many attempts.", gate.retryAfterSeconds);

  if (!request.headers.get("content-type")?.startsWith("application/json")) return reply(415, "Unsupported content type.");

  const text = await request.text();
  if (text.length > MAX_BODY_BYTES) return reply(413, "Request too large.");

  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return reply(400, "Invalid request.");
  }
  const body = Body.safeParse(json);
  if (!body.success) return reply(400, "Invalid request.");

  try {
    const auth = adminAuth();
    const decoded = await auth.verifyIdToken(body.data.idToken, true);
    if (Date.now() / 1000 - decoded.auth_time > RECENT_SIGN_IN_SECONDS) return reply(401, "Sign in again.");

    const profile = adminDb().collection(COL.users).doc(decoded.uid);
    const now = Timestamp.now();
    await profile.create({ createdAt: now }).catch((error: { code?: number }) => {
      if (error.code !== FIRESTORE_ALREADY_EXISTS) throw error;
    });

    const cookie = await auth.createSessionCookie(body.data.idToken, { expiresIn: SESSION_MAX_AGE_SECONDS * 1000 });
    const response = reply(200);
    response.cookies.set(SESSION_COOKIE, cookie, { ...cookieOptions, maxAge: SESSION_MAX_AGE_SECONDS });
    return response;
  } catch (error) {
    console.error("session sign-in failed", error);
    return reply(401, "Could not sign in.");
  }
}

export async function DELETE(request: Request) {
  if (!isSameOrigin(request)) return reply(403, "Forbidden.");
  const response = reply(200);
  response.cookies.set(SESSION_COOKIE, "", { ...cookieOptions, maxAge: 0 });
  return response;
}