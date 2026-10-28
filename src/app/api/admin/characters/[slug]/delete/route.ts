import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";
import { deleteCharacter } from "@/lib/data/admin-delete";
import { HttpError } from "@/lib/data/feats";
import { SLUG_RE } from "@/lib/firebase/paths";
import { guardWrite, type Rule } from "@/lib/security/guard";

export const runtime = "nodejs";

const NO_STORE = { "Cache-Control": "no-store" };
const RULE: Rule = { scope: "admin-character-delete", limit: 10, windowMs: 60 * 60_000, role: "admin" };
const schema = z.object({ confirm: z.string().max(80) }).strict();

export async function POST(request: Request, context: { params: Promise<{ slug: string }> }) {
  const guarded = await guardWrite(request, RULE, schema);
  if (!guarded.ok) return guarded.response;

  const { slug } = await context.params;
  if (slug.length > 80 || !SLUG_RE.test(slug)) {
    return NextResponse.json({ error: "Character not found." }, { status: 404, headers: NO_STORE });
  }
  if (guarded.body.confirm !== slug) {
    return NextResponse.json({ error: "Type the slug to confirm." }, { status: 400, headers: NO_STORE });
  }

  try {
    const result = await deleteCharacter(guarded.user.uid, slug);
    revalidatePath("/");
    revalidatePath("/matchups");
    revalidatePath(`/characters/${slug}`);
    return NextResponse.json(result, { headers: NO_STORE });
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json({ error: error.message }, { status: error.status, headers: NO_STORE });
    }
    console.error("character delete failed", error);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500, headers: NO_STORE });
  }
}