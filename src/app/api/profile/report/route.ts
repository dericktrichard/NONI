import { NextResponse } from "next/server";
import { HttpError } from "@/lib/data/feats";
import { reportImage } from "@/lib/data/image-moderation";
import { guardWrite, type Rule } from "@/lib/security/guard";
import { reportImageSchema } from "@/lib/validation/image-moderation";

export const runtime = "nodejs";

const NO_STORE = { "Cache-Control": "no-store" };
const RULE: Rule = { scope: "image-report", limit: 20, windowMs: 60 * 60_000 };

export async function POST(request: Request) {
  const guarded = await guardWrite(request, RULE, reportImageSchema, 1_024);
  if (!guarded.ok) return guarded.response;

  try {
    await reportImage(guarded.user.uid, guarded.body);
    return NextResponse.json({ ok: true }, { status: 201, headers: NO_STORE });
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status, headers: NO_STORE },
      );
    }
    console.error("image report failed", error);
    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500, headers: NO_STORE },
    );
  }
}
