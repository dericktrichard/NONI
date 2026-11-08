import { NextResponse } from "next/server";
import { getBalance } from "@/lib/data/glaze";
import { getSessionUser } from "@/lib/security/session";

export const runtime = "nodejs";

const NO_STORE = { "Cache-Control": "no-store" };

export async function GET() {
  const viewer = await getSessionUser();
  if (!viewer) return NextResponse.json({ error: "Sign in required." }, { status: 401, headers: NO_STORE });

  try {
    return NextResponse.json({ balance: await getBalance(viewer.uid) }, { headers: NO_STORE });
  } catch (error) {
    console.error("glaze balance failed", error);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500, headers: NO_STORE });
  }
}