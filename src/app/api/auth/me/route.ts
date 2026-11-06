import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { COL } from "@/lib/firebase/paths";
import { roleOf } from "@/lib/security/roles";
import { getSessionUser } from "@/lib/security/session";

export const runtime = "nodejs";

const HEADERS = { "Cache-Control": "no-store" };

export async function GET() {
  const user = await getSessionUser(false);
  if (!user) return NextResponse.json(null, { headers: HEADERS });

  let handle: string | null = null;
  try {
    const doc = await adminDb().collection(COL.users).doc(user.uid).get();
    const stored = doc.get("handle");
    handle = typeof stored === "string" ? stored : null;
  } catch {
    handle = null;
  }

  return NextResponse.json(
    { uid: user.uid, verified: user.email_verified === true, role: roleOf(user), handle },
    { headers: HEADERS },
  );
}