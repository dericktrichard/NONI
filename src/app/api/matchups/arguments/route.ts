import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { HttpError } from "@/lib/data/feats";
import { createArgument } from "@/lib/data/matchup-arguments";
import { guardWrite } from "@/lib/security/guard";
import { argumentSchema } from "@/lib/validation/argument";

export const runtime = "nodejs";

const NO_STORE = { "Cache-Control": "no-store" };
const RULE = { scope: "matchup-argument", limit: 10, windowMs: 60 * 60_000 };

export async function POST(request: Request) {
  const guarded = await guardWrite(request, RULE, argumentSchema, 8_192);
  if (!guarded.ok) return guarded.response;
  const { body, user } = guarded;

  try {
    await createArgument(user.uid, body);
    revalidatePath(`/matchups/${body.a}/${body.b}`);
    revalidatePath(`/matchups/${body.b}/${body.a}`);
    return NextResponse.json({ ok: true }, { status: 201, headers: NO_STORE });
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json({ error: error.message }, { status: error.status, headers: NO_STORE });
    }
    console.error("argument failed", error);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500, headers: NO_STORE });
  }
}