import { NextResponse } from "next/server";
import { HttpError } from "@/lib/data/feats";
import { buyHomeBanner, getPlus } from "@/lib/data/plus";
import { guardWrite, type Rule } from "@/lib/security/guard";
import { plusSchema } from "@/lib/validation/plus";

export const runtime = "nodejs";

const NO_STORE = { "Cache-Control": "no-store" };
const RULE: Rule = { scope: "plus", limit: 240, windowMs: 60 * 60_000 };

const reply = (body: unknown, status = 200) =>
  NextResponse.json(body, { status, headers: NO_STORE });

export async function POST(request: Request) {
  const guarded = await guardWrite(request, RULE, plusSchema, 256);
  if (!guarded.ok) return guarded.response;

  try {
    const { uid } = guarded.user;
    const body = guarded.body;
    return reply(
      body.op === "banner" ? await buyHomeBanner(uid, body.nonce) : await getPlus(uid),
    );
  } catch (error) {
    if (error instanceof HttpError) return reply({ error: error.message }, error.status);
    console.error("plus failed", error);
    return reply({ error: "Something went wrong." }, 500);
  }
}
