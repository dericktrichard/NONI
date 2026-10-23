import { NextResponse } from "next/server";
import { guardWrite } from "@/lib/security/guard";
import { HttpError } from "@/lib/data/feats";
import { moderateFeat } from "@/lib/data/moderation";
import { moderateSchema } from "@/lib/validation/moderation";

export async function POST(request: Request) {
  const guarded = await guardWrite(
    request,
    { scope: "mod-action", limit: 120, windowMs: 60 * 60 * 1000, role: "moderator" },
    moderateSchema,
  );
  if (!guarded.ok) return guarded.response;

  try {
    const result = await moderateFeat(guarded.user.uid, guarded.body);
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json({ error: error.message }, { status: error.status, headers: { "Cache-Control": "no-store" } });
    }
    console.error("moderation failed", error);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}