import { NextResponse } from "next/server";
import { todayFor } from "@/lib/battle/fair-play";
import { hasPlus } from "@/lib/data/plus";
import { getDaily } from "@/lib/data/daily";
import { guardWrite, type Rule } from "@/lib/security/guard";
import { todaySchema } from "@/lib/validation/battle";

export const runtime = "nodejs";

const NO_STORE = { "Cache-Control": "no-store" };
const RULE: Rule = { scope: "battle-today", limit: 120, windowMs: 60 * 60_000 };

export async function POST(request: Request) {
  const guarded = await guardWrite(request, RULE, todaySchema, 64);
  if (!guarded.ok) return guarded.response;

  try {
    return NextResponse.json(
      todayFor(await getDaily(guarded.user.uid), await hasPlus(guarded.user.uid)),
      {
        headers: NO_STORE,
      },
    );
  } catch (error) {
    console.error("battle-today failed", error);
    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500, headers: NO_STORE },
    );
  }
}
