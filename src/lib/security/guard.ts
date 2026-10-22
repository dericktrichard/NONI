import "server-only";
import { NextResponse } from "next/server";
import type { z } from "zod";
import { getClientIp } from "@/lib/security/client-ip";
import { isSameOrigin } from "@/lib/security/origin";
import { consume } from "@/lib/security/rate-limit";
import { createMemoryLimiter } from "@/lib/security/rate-limit-core";
import { hasRole } from "@/lib/security/roles";
import { getSessionUser } from "@/lib/security/session";

export interface Rule {
  scope: string;
  limit: number;
  windowMs: number;
  role?: "moderator" | "admin";
}

export type SessionUser = NonNullable<Awaited<ReturnType<typeof getSessionUser>>>;
type Failure = { ok: false; response: NextResponse };
export type Checked = { ok: true; user: SessionUser } | Failure;
export type Guarded<T> = { ok: true; user: SessionUser; body: T } | Failure;

const byIp = createMemoryLimiter(60, 60_000);

function fail(status: number, error: string, retryAfter?: number): Failure {
  const headers: Record<string, string> = { "Cache-Control": "no-store" };
  if (retryAfter) headers["Retry-After"] = String(retryAfter);
  return { ok: false, response: NextResponse.json({ error }, { status, headers }) };
}

export async function guardRequest(request: Request, rule: Rule): Promise<Checked> {
  if (!isSameOrigin(request)) return fail(403, "Forbidden.");

  const ip = byIp(getClientIp(request));
  if (!ip.allowed) return fail(429, "Too many requests.", ip.retryAfterSeconds);

  const user = await getSessionUser();
  if (!user) return fail(401, "Sign in required.");
  if (user.email_verified !== true) return fail(403, "Verify your email first.");
  if (rule.role && !hasRole(user, rule.role)) return fail(403, "Forbidden.");

  try {
    const decision = await consume(rule.scope, user.uid, rule.limit, rule.windowMs);
    if (!decision.allowed) return fail(429, "Too many requests.", decision.retryAfterSeconds);
  } catch (error) {
    console.error("rate limit failed", error);
    return fail(503, "Try again shortly.");
  }

  return { ok: true, user };
}

export async function guardWrite<T>(
  request: Request,
  rule: Rule,
  schema: z.ZodType<T>,
  maxBytes = 16_384,
): Promise<Guarded<T>> {
  const checked = await guardRequest(request, rule);
  if (!checked.ok) return checked;

  if (!request.headers.get("content-type")?.startsWith("application/json")) return fail(415, "Unsupported content type.");
  const text = await request.text();
  if (text.length > maxBytes) return fail(413, "Request too large.");

  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return fail(400, "Invalid request.");
  }
  const parsed = schema.safeParse(json);
  if (!parsed.success) return fail(400, "Invalid request.");

  return { ok: true, user: checked.user, body: parsed.data };
}