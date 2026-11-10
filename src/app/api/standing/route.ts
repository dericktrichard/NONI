import { NextResponse } from "next/server";
import { HttpError } from "@/lib/data/feats";
import { setBoards } from "@/lib/data/standing";
import { guardWrite, type Rule } from "@/lib/security/guard";
import { boardsSchema } from "@/lib/validation/standing";

export const runtime = "nodejs";

const NO_STORE = { "Cache-Control": "no-store" };
const RULE: Rule = { scope: "standing-boards", limit: 20, windowMs: 60 * 60_000 };

const reply = (body: unknown, status = 200) =>
  NextResponse.json(body, { status, headers: NO_STORE });

export async function POST(request: Request) {
  const guarded = await guardWrite(request, RULE, boardsSchema, 256);
  if (!guarded.ok) return guarded.response;

  try {
    await setBoards(guarded.user.uid, guarded.body.on);
    return reply({ on: guarded.body.on });
  } catch (error) {
    if (error instanceof HttpError) return reply({ error: error.message }, error.status);
    console.error("standing-boards failed", error);
    return reply({ error: "Something went wrong." }, 500);
  }
}
