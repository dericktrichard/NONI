import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { HttpError } from "@/lib/data/feats";
import { saveProfile } from "@/lib/data/profile";
import { guardWrite, type Rule } from "@/lib/security/guard";
import { profileSchema } from "@/lib/validation/profile";

export const runtime = "nodejs";

const NO_STORE = { "Cache-Control": "no-store" };
const RULE: Rule = { scope: "profile-save", limit: 10, windowMs: 60 * 60_000 };

export async function PUT(request: Request) {
  const guarded = await guardWrite(request, RULE, profileSchema, 2_048);
  if (!guarded.ok) return guarded.response;

  try {
    const result = await saveProfile(guarded.user.uid, guarded.body);
    revalidatePath(`/u/${result.handle}`);
    if (result.previous && result.previous !== result.handle) revalidatePath(`/u/${result.previous}`);
    return NextResponse.json({ handle: result.handle }, { headers: NO_STORE });
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json({ error: error.message }, { status: error.status, headers: NO_STORE });
    }
    console.error("profile save failed", error);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500, headers: NO_STORE });
  }
}