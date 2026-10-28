import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { COL, SLUG_RE, matchupId } from "@/lib/firebase/paths";
import { createMemoryLimiter } from "@/lib/security/rate-limit-core";
import { getSessionUser } from "@/lib/security/session";
import { ARGUMENT_ID_RE } from "@/lib/validation/ids";

export const runtime = "nodejs";

const MAX_IDS = 25;
const limiter = createMemoryLimiter(120, 60_000);
const NO_STORE = { "Cache-Control": "no-store" };

const reply = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: NO_STORE });
const validSlug = (slug: string) => slug.length > 0 && slug.length <= 80 && SLUG_RE.test(slug);

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const a = params.get("a") ?? "";
  const b = params.get("b") ?? "";
  const ids = (params.get("ids") ?? "").split(",").filter(Boolean);

  if (!validSlug(a) || !validSlug(b) || a === b) return reply({ error: "Invalid request." }, 400);
  if (ids.length > MAX_IDS || ids.some((id) => !ARGUMENT_ID_RE.test(id))) return reply({ error: "Invalid request." }, 400);

  const user = await getSessionUser(false);
  if (!user || ids.length === 0) return reply({ votes: {} });
  if (!limiter(user.uid).allowed) return reply({ error: "Too many requests." }, 429);

  try {
    const db = adminDb();
    const base = db.collection(COL.matchups).doc(matchupId(a, b)).collection(COL.arguments);
    const snaps = await db.getAll(...ids.map((id) => base.doc(id).collection(COL.votes).doc(user.uid)));
    const votes: Record<string, 1 | -1> = {};
    snaps.forEach((snap, index) => {
      const value = snap.exists ? Number(snap.get("value")) : 0;
      if (value === 1 || value === -1) votes[ids[index]] = value;
    });
    return reply({ votes });
  } catch (error) {
    console.error("argument mine failed", error);
    return reply({ error: "Something went wrong." }, 500);
  }
}