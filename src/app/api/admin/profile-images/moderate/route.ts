import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { HttpError } from "@/lib/data/feats";
import { moderateImage } from "@/lib/data/image-moderation";
import { guardWrite, type Rule } from "@/lib/security/guard";
import { moderateImageSchema } from "@/lib/validation/image-moderation";

export const runtime = "nodejs";

const NO_STORE = { "Cache-Control": "no-store" };
const RULE: Rule = {
  scope: "image-moderate",
  limit: 120,
  windowMs: 60 * 60_000,
  role: "moderator",
};

export async function POST(request: Request) {
  const guarded = await guardWrite(request, RULE, moderateImageSchema, 1_024);
  if (!guarded.ok) return guarded.response;

  try {
    const result = await moderateImage(guarded.user.uid, guarded.body);
    if (result.handle) revalidatePath(`/u/${result.handle}`);
    return NextResponse.json({ ok: true }, { headers: NO_STORE });
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status, headers: NO_STORE },
      );
    }
    console.error("image moderation failed", error);
    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500, headers: NO_STORE },
    );
  }
}
