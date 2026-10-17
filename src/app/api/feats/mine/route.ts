import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { COL, SLUG_RE } from "@/lib/firebase/paths";
import { createMemoryLimiter } from "@/lib/security/rate-limit-core";
import { getSessionUser } from "@/lib/security/session";
import { FEAT_ID_RE } from "@/lib/validation/ids";

export const runtime = "nodejs";

const MAX_IDS = 50;
const limiter = createMemoryLimiter(120, 60_000);
const NO_STORE = { "Cache-Control": "no-store" };

const reply = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: NO_STORE });

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const characterId = params.get("characterId") ?? "";
  const ids = (params.get("ids") ?? "").split(",").filter(Boolean);

  if (characterId.length > 80 || !SLUG_RE.test(characterId)) return reply({ error: "Invalid request." }, 400);
  if (ids.length > MAX_IDS || ids.some((id) => !FEAT_ID_RE.test(id))) return reply({ error: "Invalid request." }, 400);

  const user = await getSessionUser(false);
  if (!user || ids.length === 0) return reply({ votes: {} });

  if (!limiter(user.uid).allowed) return reply({ error: "Too many requests." }, 429);

  try {
    const db = adminDb();
    const refs = ids.map((id) =>
      db.collection(COL.characters).doc(characterId).collection(COL.feats).doc(id).collection(COL.votes).doc(user.uid),
    );
    const snaps = await db.getAll(...refs);
    const votes: Record<string, 1 | -1> = {};
    snaps.forEach((snap, i) => {
      const value = snap.exists ? Number(snap.get("value")) : 0;
      if (value === 1 || value === -1) votes[ids[i]] = value;
    });
    return reply({ votes });
  } catch (error) {
    console.error("votes lookup failed", error);
    return reply({ error: "Could not load your votes." }, 500);
  }
}