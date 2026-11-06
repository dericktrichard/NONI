import { NextResponse } from "next/server";
import { HttpError } from "@/lib/data/feats";
import { saveLook } from "@/lib/data/profile-look";
import { guardWrite, type Rule } from "@/lib/security/guard";
import { lookSchema } from "@/lib/validation/look";

export const runtime = "nodejs";

const NO_STORE = { "Cache-Control": "no-store" };
const RULE: Rule = { scope: "profile-look", limit: 30, windowMs: 60 * 60_000 };

export async function PUT(request: Request) {
  const guarded = await guardWrite(request, RULE, lookSchema, 1_024);
  if (!guarded.ok) return guarded.response;

  try {
    await saveLook(guarded.user.uid, guarded.body);
    return NextResponse.json({ ok: true }, { headers: NO_STORE });
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json({ error: error.message }, { status: error.status, headers: NO_STORE });
    }
    console.error("look save failed", error);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500, headers: NO_STORE });
  }
}