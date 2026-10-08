import { NextResponse } from "next/server";
import { HttpError, castVote } from "@/lib/data/feats";
import { guardWrite } from "@/lib/security/guard";
import { voteSchema } from "@/lib/validation/feat";

export const runtime = "nodejs";

const NO_STORE = { "Cache-Control": "no-store" };
const RULE = { scope: "feat-vote", limit: 60, windowMs: 60 * 60_000 };

export async function POST(request: Request) {
  const guarded = await guardWrite(request, RULE, voteSchema);
  if (!guarded.ok) return guarded.response;
  const { body, user } = guarded;

  try {
    const result = await castVote(user.uid, body.characterId, body.featId, body.value);
    return NextResponse.json(result, { headers: NO_STORE });
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json({ error: error.message }, { status: error.status, headers: NO_STORE });
    }
    console.error("vote failed", error);
    return NextResponse.json({ error: "Could not save the vote." }, { status: 500, headers: NO_STORE });
  }
}