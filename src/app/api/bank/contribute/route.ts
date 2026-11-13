import { NextResponse } from "next/server";
import { contribute } from "@/lib/data/banks";
import { HttpError } from "@/lib/data/feats";
import { guardWrite, type Rule } from "@/lib/security/guard";
import { contributeSchema } from "@/lib/validation/bank";

export const runtime = "nodejs";

const NO_STORE = { "Cache-Control": "no-store" };
const RULE: Rule = { scope: "bank-contribute", limit: 30, windowMs: 60 * 60_000 };

const reply = (body: unknown, status = 200) =>
  NextResponse.json(body, { status, headers: NO_STORE });

export async function POST(request: Request) {
  const guarded = await guardWrite(request, RULE, contributeSchema, 512);
  if (!guarded.ok) return guarded.response;

  try {
    const { slug, amount, nonce } = guarded.body;
    return reply(await contribute(guarded.user.uid, slug, amount, nonce));
  } catch (error) {
    if (error instanceof HttpError) return reply({ error: error.message }, error.status);
    console.error("bank-contribute failed", error);
    return reply({ error: "Something went wrong." }, 500);
  }
}
