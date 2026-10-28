import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { HttpError } from "@/lib/data/feats";
import { moderateArgument } from "@/lib/data/moderation";
import { guardWrite } from "@/lib/security/guard";
import { moderateArgumentSchema } from "@/lib/validation/moderation";

export const runtime = "nodejs";

const NO_STORE = { "Cache-Control": "no-store" };
const RULE = { scope: "mod-argument", limit: 120, windowMs: 60 * 60_000, role: "moderator" as const };

export async function POST(request: Request) {
  const guarded = await guardWrite(request, RULE, moderateArgumentSchema);
  if (!guarded.ok) return guarded.response;
  const { body, user } = guarded;

  try {
    const result = await moderateArgument(user.uid, body);
    revalidatePath(`/matchups/${body.a}/${body.b}`);
    revalidatePath(`/matchups/${body.b}/${body.a}`);
    return NextResponse.json(result, { headers: NO_STORE });
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json({ error: error.message }, { status: error.status, headers: NO_STORE });
    }
    console.error("argument moderation failed", error);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500, headers: NO_STORE });
  }
}