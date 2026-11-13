import { NextResponse } from "next/server";
import { HttpError } from "@/lib/data/feats";
import { claimTopReward, previewTopReward } from "@/lib/data/top-reward";
import { guardWrite, type Rule } from "@/lib/security/guard";
import { topSchema } from "@/lib/validation/top-reward";

export const runtime = "nodejs";

const NO_STORE = { "Cache-Control": "no-store" };
const RULE: Rule = { scope: "glaze-top", limit: 20, windowMs: 60 * 60_000 };

const reply = (body: unknown, status = 200) =>
  NextResponse.json(body, { status, headers: NO_STORE });

export async function POST(request: Request) {
  const guarded = await guardWrite(request, RULE, topSchema, 128);
  if (!guarded.ok) return guarded.response;

  try {
    const uid = guarded.user.uid;
    return reply(
      guarded.body.preview ? await previewTopReward(uid) : await claimTopReward(uid),
    );
  } catch (error) {
    if (error instanceof HttpError) return reply({ error: error.message }, error.status);
    console.error("glaze-top failed", error);
    return reply({ error: "Something went wrong." }, 500);
  }
}
