import { NextResponse } from "next/server";
import { HttpError } from "@/lib/data/feats";
import { claimDaily } from "@/lib/data/glaze";
import { guardRequest, type Rule } from "@/lib/security/guard";

export const runtime = "nodejs";

const NO_STORE = { "Cache-Control": "no-store" };
const RULE: Rule = { scope: "glaze-claim", limit: 20, windowMs: 60 * 60_000 };

export async function POST(request: Request) {
  const checked = await guardRequest(request, RULE);
  if (!checked.ok) return checked.response;

  try {
    return NextResponse.json(await claimDaily(checked.user.uid), { headers: NO_STORE });
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status, headers: NO_STORE },
      );
    }
    console.error("glaze claim failed", error);
    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500, headers: NO_STORE },
    );
  }
}
