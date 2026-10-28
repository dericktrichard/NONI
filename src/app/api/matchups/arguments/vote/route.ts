import { NextResponse } from "next/server";
import { HttpError } from "@/lib/data/feats";
import { castArgumentVote } from "@/lib/data/matchup-arguments";
import { guardWrite } from "@/lib/security/guard";
import { argumentVoteSchema } from "@/lib/validation/argument";

export const runtime = "nodejs";

const NO_STORE = { "Cache-Control": "no-store" };
const RULE = { scope: "argument-vote", limit: 60, windowMs: 60 * 60_000 };

export async function POST(request: Request) {
  const guarded = await guardWrite(request, RULE, argumentVoteSchema);
  if (!guarded.ok) return guarded.response;

  try {
    const result = await castArgumentVote(guarded.user.uid, guarded.body);
    return NextResponse.json(result, { headers: NO_STORE });
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json({ error: error.message }, { status: error.status, headers: NO_STORE });
    }
    console.error("argument vote failed", error);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500, headers: NO_STORE });
  }
}