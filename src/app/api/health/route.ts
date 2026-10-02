import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  // Never expose diagnostics in production
  if (process.env.NODE_ENV === "production") {
    return new NextResponse(null, { status: 404 });
  }

  try {
    await adminAuth().listUsers(1);
    await adminDb().listCollections();
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "unknown" },
      { status: 500 },
    );
  }
}