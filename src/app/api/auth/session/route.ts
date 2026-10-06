import { NextResponse } from "next/server";
import { z } from "zod";
import { adminAuth } from "@/lib/firebase/admin-auth";
import { isSameOrigin } from "@/lib/security/origin";
import {
  RECENT_SIGN_IN_SECONDS,
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  cookieOptions,
} from "@/lib/security/session";

export const runtime = "nodejs";

const MAX_BODY_BYTES = 8192;
const NO_STORE = { "Cache-Control": "no-store" };
const Body = z.object({ idToken: z.string().min(100).max(4096) }).strict();

const reply = (status: number, error?: string) =>
  NextResponse.json(error ? { error } : { ok: true }, { status, headers: NO_STORE });

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return reply(403, "Forbidden.");
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

    const cookie = await auth.createSessionCookie(body.data.idToken, { expiresIn: SESSION_MAX_AGE_SECONDS * 1000 });
    const response = reply(200);
    response.cookies.set(SESSION_COOKIE, cookie, { ...cookieOptions, maxAge: SESSION_MAX_AGE_SECONDS });
    return response;
  } catch {
    return reply(401, "Could not sign in.");
  }
}

export async function DELETE(request: Request) {
  if (!isSameOrigin(request)) return reply(403, "Forbidden.");
  const response = reply(200);
  response.cookies.set(SESSION_COOKIE, "", { ...cookieOptions, maxAge: 0 });
  return response;
}