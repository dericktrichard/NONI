import { NextResponse } from "next/server";
import { HttpError } from "@/lib/data/feats";
import { suggestTeam } from "@/lib/data/battles";
import { guardWrite, type Rule } from "@/lib/security/guard";
import { teamSuggestSchema } from "@/lib/validation/battle";

export const runtime = "nodejs";

const NO_STORE = { "Cache-Control": "no-store" };
const RULE: Rule = { scope: "battle-team", limit: 120, windowMs: 60 * 60_000 };

const reply = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: NO_STORE });

export async function POST(request: Request) {
  const guarded = await guardWrite(request, RULE, teamSuggestSchema, 1024);
  if (!guarded.ok) return guarded.response;

  try {
    return reply({ team: await suggestTeam(guarded.body) });
  } catch (error) {
    if (error instanceof HttpError) return reply({ error: error.message }, error.status);
    console.error("battle-team failed", error);
    return reply({ error: "Something went wrong." }, 500);
  }
}