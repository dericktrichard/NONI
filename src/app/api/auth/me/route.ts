import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/security/session";

export const runtime = "nodejs";

export async function GET() {
  const user = await getSessionUser(false);
  const body = user ? { uid: user.uid, verified: user.email_verified === true } : null;
  return NextResponse.json(body, { headers: { "Cache-Control": "no-store" } });
}