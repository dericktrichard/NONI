import { NextResponse } from "next/server";
import { HttpError } from "@/lib/data/feats";
import { reportArgument } from "@/lib/data/moderation";
import { guardWrite } from "@/lib/security/guard";
import { reportArgumentSchema } from "@/lib/validation/moderation";

export const runtime = "nodejs";

const NO_STORE = { "Cache-Control": "no-store" };
const RULE = { scope: "argument-report", limit: 20, windowMs: 60 * 60_000 };

export async function POST(request: Request) {
  const guarded = await guardWrite(request, RULE, reportArgumentSchema);
  if (!guarded.ok) return guarded.response;

  try {
    await reportArgument(guarded.user.uid, guarded.body);
    return NextResponse.json({ ok: true }, { status: 201, headers: NO_STORE });
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json({ error: error.message }, { status: error.status, headers: NO_STORE });
    }
    console.error("argument report failed", error);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500, headers: NO_STORE });
  }
}