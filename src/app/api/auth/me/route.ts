import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/security/session";
import { roleOf } from "@/lib/security/roles";

export const runtime = "nodejs";

export async function GET() {
  const user = await getSessionUser(false);
  const body = user ? { uid: user.uid, verified: user.email_verified === true, role: roleOf(user) } : null;
  return NextResponse.json(body, { headers: { "Cache-Control": "no-store" } });
}