import { NextResponse } from "next/server";
import { getMyStanding } from "@/lib/data/standing";
import { getSessionUser } from "@/lib/security/session";

export const runtime = "nodejs";

const NO_STORE = { "Cache-Control": "no-store" };

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user)
      return NextResponse.json(
        { error: "Sign in first." },
        { status: 401, headers: NO_STORE },
      );
    return NextResponse.json(await getMyStanding(user.uid), { headers: NO_STORE });
  } catch (error) {
    console.error("standing me failed", error);
    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500, headers: NO_STORE },
    );
  }
}
