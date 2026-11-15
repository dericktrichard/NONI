import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";
import { publishCharacter } from "@/lib/data/admin-import";
import { HttpError } from "@/lib/data/feats";
import { SLUG_RE } from "@/lib/firebase/paths";
import { guardWrite, type Rule } from "@/lib/security/guard";

export const runtime = "nodejs";

const NO_STORE = { "Cache-Control": "no-store" };
const RULE: Rule = {
  scope: "admin-character-publish",
  limit: 120,
  windowMs: 60 * 60_000,
  role: "admin",
};
const schema = z.object({ force: z.boolean().default(false) }).strict();

export async function POST(
  request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const guarded = await guardWrite(request, RULE, schema, 256);
  if (!guarded.ok) return guarded.response;

  const { slug } = await context.params;
  if (slug.length > 80 || !SLUG_RE.test(slug)) {
    return NextResponse.json(
      { error: "Character not found." },
      { status: 404, headers: NO_STORE },
    );
  }

  try {
    await publishCharacter(guarded.user.uid, slug, guarded.body.force);
    revalidatePath("/");
    revalidatePath("/matchups");
    revalidatePath(`/characters/${slug}`);
    return NextResponse.json({ ok: true }, { headers: NO_STORE });
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status, headers: NO_STORE },
      );
    }
    console.error("character publish failed", error);
    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500, headers: NO_STORE },
    );
  }
}
