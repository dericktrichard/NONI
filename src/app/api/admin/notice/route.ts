import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { saveNotice } from "@/lib/data/site-notice";
import { guardWrite, type Rule } from "@/lib/security/guard";
import { noticeSchema } from "@/lib/validation/notice";

export const runtime = "nodejs";

const NO_STORE = { "Cache-Control": "no-store" };
const RULE: Rule = {
  scope: "admin-notice",
  limit: 60,
  windowMs: 60 * 60_000,
  role: "admin",
};

export async function POST(request: Request) {
  const guarded = await guardWrite(request, RULE, noticeSchema, 4096);
  if (!guarded.ok) return guarded.response;

  try {
    await saveNotice(guarded.user.uid, guarded.body);
    revalidatePath("/");
    return NextResponse.json({ ok: true }, { headers: NO_STORE });
  } catch (error) {
    console.error("notice save failed", error);
    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500, headers: NO_STORE },
    );
  }
}
