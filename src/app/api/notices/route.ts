import { NextResponse } from "next/server";
import { getNotices, markNoticesRead } from "@/lib/data/notices";
import { guardWrite, type Rule } from "@/lib/security/guard";
import { noticesSchema } from "@/lib/validation/notices";

export const runtime = "nodejs";

const NO_STORE = { "Cache-Control": "no-store" };
const RULE: Rule = { scope: "notices", limit: 120, windowMs: 60 * 60_000 };

const reply = (body: unknown, status = 200) =>
  NextResponse.json(body, { status, headers: NO_STORE });

export async function POST(request: Request) {
  const guarded = await guardWrite(request, RULE, noticesSchema, 256);
  if (!guarded.ok) return guarded.response;

  try {
    const { uid } = guarded.user;
    const inbox = await getNotices(uid);
    if (guarded.body.markRead) await markNoticesRead(uid);
    return reply(inbox);
  } catch (error) {
    console.error("notices failed", error);
    return reply({ error: "Something went wrong." }, 500);
  }
}
