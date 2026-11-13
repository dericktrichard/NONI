import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { COL } from "@/lib/firebase/paths";
import { readLook } from "@/lib/profile/look";
import { roleOf } from "@/lib/security/roles";
import { getSessionUser } from "@/lib/security/session";

export const runtime = "nodejs";

const HEADERS = { "Cache-Control": "no-store" };

export async function GET() {
  const user = await getSessionUser(false);
  if (!user) return NextResponse.json(null, { headers: HEADERS });

  let handle: string | null = null;
  let avatarUrl: string | null = null;
  let avatarName: string | null = null;
  try {
    const doc = await adminDb().collection(COL.users).doc(user.uid).get();
    const stored = doc.get("handle");
    handle = typeof stored === "string" ? stored : null;
    const look = readLook(doc.data() ?? {});
    avatarUrl = look.avatarUrl;
    avatarName = look.avatarName;
  } catch {
    handle = null;
  }

  return NextResponse.json(
    {
      uid: user.uid,
      verified: user.email_verified === true,
      role: roleOf(user),
      handle,
      avatarUrl,
      avatarName,
    },
    { headers: HEADERS },
  );
}
