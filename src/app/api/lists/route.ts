import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { HttpError } from "@/lib/data/feats";
import { createList } from "@/lib/data/lists";
import { guardWrite, type Rule } from "@/lib/security/guard";
import { listSchema } from "@/lib/validation/list";

export const runtime = "nodejs";

const NO_STORE = { "Cache-Control": "no-store" };
const RULE: Rule = { scope: "list-create", limit: 10, windowMs: 60 * 60_000 };

export async function POST(request: Request) {
  const guarded = await guardWrite(request, RULE, listSchema, 8_192);
  if (!guarded.ok) return guarded.response;

  try {
    const result = await createList(guarded.user.uid, guarded.body);
    revalidatePath(`/u/${result.handle}`);
    return NextResponse.json({ id: result.id }, { status: 201, headers: NO_STORE });
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json({ error: error.message }, { status: error.status, headers: NO_STORE });
    }
    console.error("list create failed", error);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500, headers: NO_STORE });
  }
}