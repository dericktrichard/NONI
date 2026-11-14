import { NextResponse } from "next/server";
import { HttpError } from "@/lib/data/feats";
import { buyFlair, clearFlair, equipFlair, getFlair } from "@/lib/data/flair";
import { guardWrite, type Rule } from "@/lib/security/guard";
import { flairSchema } from "@/lib/validation/flair";

export const runtime = "nodejs";

const NO_STORE = { "Cache-Control": "no-store" };
const RULE: Rule = { scope: "flair", limit: 60, windowMs: 60 * 60_000 };

const reply = (body: unknown, status = 200) =>
  NextResponse.json(body, { status, headers: NO_STORE });

export async function POST(request: Request) {
  const guarded = await guardWrite(request, RULE, flairSchema, 256);
  if (!guarded.ok) return guarded.response;

  try {
    const { uid } = guarded.user;
    const body = guarded.body;
    switch (body.op) {
      case "buy":
        return reply(await buyFlair(uid, body.id));
      case "equip":
        return reply(await equipFlair(uid, body.id));
      case "clear":
        return reply(await clearFlair(uid, body.kind));
      default:
        return reply(await getFlair(uid));
    }
  } catch (error) {
    if (error instanceof HttpError) return reply({ error: error.message }, error.status);
    console.error("flair failed", error);
    return reply({ error: "Something went wrong." }, 500);
  }
}
