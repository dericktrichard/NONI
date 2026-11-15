import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";
import { publishAllDrafts } from "@/lib/data/admin-import";
import { guardWrite, type Rule } from "@/lib/security/guard";

export const runtime = "nodejs";
export const maxDuration = 60;

const NO_STORE = { "Cache-Control": "no-store" };
const RULE: Rule = {
  scope: "admin-character-publish-all",
  limit: 10,
  windowMs: 60 * 60_000,
  role: "admin",
};
const schema = z.object({}).strict();

export async function POST(request: Request) {
  const guarded = await guardWrite(request, RULE, schema, 64);
  if (!guarded.ok) return guarded.response;

  try {
    const published = await publishAllDrafts(guarded.user.uid);
    revalidatePath("/");
    revalidatePath("/matchups");
    return NextResponse.json({ ok: true, published }, { headers: NO_STORE });
  } catch (error) {
    console.error("publish all failed", error);
    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500, headers: NO_STORE },
    );
  }
}
