import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { HttpError } from "@/lib/data/feats";
import { deleteList } from "@/lib/data/lists";
import { guardWrite, type Rule } from "@/lib/security/guard";
import { LIST_ID_RE, deleteListSchema } from "@/lib/validation/list";

export const runtime = "nodejs";

const NO_STORE = { "Cache-Control": "no-store" };
const RULE: Rule = { scope: "list-delete", limit: 20, windowMs: 60 * 60_000 };

type Context = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: Context) {
  const guarded = await guardWrite(request, RULE, deleteListSchema, 256);
  if (!guarded.ok) return guarded.response;

  const { id } = await context.params;
  if (!LIST_ID_RE.test(id)) {
    return NextResponse.json({ error: "List not found." }, { status: 404, headers: NO_STORE });
  }

  try {
    const result = await deleteList(guarded.user.uid, id);
    if (result.handle) revalidatePath(`/u/${result.handle}`);
    return NextResponse.json({ ok: true }, { headers: NO_STORE });
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json({ error: error.message }, { status: error.status, headers: NO_STORE });
    }
    console.error("list delete failed", error);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500, headers: NO_STORE });
  }
}