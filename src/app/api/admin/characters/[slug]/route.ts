import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { updateCharacter } from "@/lib/data/admin-characters";
import { HttpError } from "@/lib/data/feats";
import { SLUG_RE } from "@/lib/firebase/paths";
import { guardWrite, type Rule } from "@/lib/security/guard";
import { updateCharacterSchema } from "@/lib/validation/character";

export const runtime = "nodejs";

const NO_STORE = { "Cache-Control": "no-store" };
const RULE: Rule = { scope: "admin-character-edit", limit: 60, windowMs: 60 * 60_000, role: "admin" };

export async function PUT(request: Request, context: { params: Promise<{ slug: string }> }) {
  const guarded = await guardWrite(request, RULE, updateCharacterSchema);
  if (!guarded.ok) return guarded.response;

  const { slug } = await context.params;
  if (slug.length > 80 || !SLUG_RE.test(slug)) {
    return NextResponse.json({ error: "Character not found." }, { status: 404, headers: NO_STORE });
  }

  try {
    await updateCharacter(slug, guarded.body);
    revalidatePath(`/characters/${slug}`);
    revalidatePath("/");
    return NextResponse.json({ ok: true }, { headers: NO_STORE });
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json({ error: error.message }, { status: error.status, headers: NO_STORE });
    }
    console.error("character update failed", error);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500, headers: NO_STORE });
  }
}