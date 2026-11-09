import { NextResponse } from "next/server";
import { loadPool } from "@/lib/data/battle-pool";

export const runtime = "nodejs";

export async function GET() {
  try {
    const cards = (await loadPool()).map((item) => item.card).sort((a, b) => a.name.localeCompare(b.name));
    return NextResponse.json({ cards }, { headers: { "Cache-Control": "public, max-age=60, s-maxage=300" } });
  } catch (error) {
    console.error("battle roster failed", error);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}