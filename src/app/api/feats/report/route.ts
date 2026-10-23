import { NextResponse } from "next/server";
import { guardWrite } from "@/lib/security/guard";
import { HttpError } from "@/lib/data/feats";
import { reportFeat } from "@/lib/data/moderation";
import { reportSchema } from "@/lib/validation/moderation";

export async function POST(request: Request) {
  const guarded = await guardWrite(
    request,
    { scope: "feat-report", limit: 20, windowMs: 60 * 60 * 1000 },
    reportSchema,
  );
  if (!guarded.ok) return guarded.response;

  try {
    await reportFeat(guarded.user.uid, guarded.body);
    return NextResponse.json({ ok: true }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json({ error: error.message }, { status: error.status, headers: { "Cache-Control": "no-store" } });
    }
    console.error("report failed", error);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}