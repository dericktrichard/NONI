import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { COL, SLUG_RE, matchupId } from "@/lib/firebase/paths";
import { orderPair, toViewPick } from "@/lib/matchup/vote";
import { createMemoryLimiter } from "@/lib/security/rate-limit-core";
import { getSessionUser } from "@/lib/security/session";

export const runtime = "nodejs";

const limiter = createMemoryLimiter(120, 60_000);
const NO_STORE = { "Cache-Control": "no-store" };

const reply = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: NO_STORE });
const valid = (slug: string) => slug.length > 0 && slug.length <= 80 && SLUG_RE.test(slug);

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const a = params.get("a") ?? "";
  const b = params.get("b") ?? "";
  if (!valid(a) || !valid(b) || a === b) return reply({ error: "Invalid request." }, 400);

  const user = await getSessionUser(false);
  if (!user) return reply({ pick: "none" });
  if (!limiter(user.uid).allowed) return reply({ error: "Too many requests." }, 429);

  try {
    const { flipped } = orderPair(a, b);
    const snap = await adminDb()
      .collection(COL.matchups)
      .doc(matchupId(a, b))
      .collection(COL.votes)
      .doc(user.uid)
      .get();
    const side = snap.exists ? snap.get("side") : null;
    return reply({ pick: toViewPick(side === "a" || side === "b" ? side : null, flipped) });
  } catch (error) {
    console.error("matchup mine failed", error);
    return reply({ error: "Something went wrong." }, 500);
  }
}