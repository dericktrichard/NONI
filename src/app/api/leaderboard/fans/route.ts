import { NextResponse } from "next/server";
import { getFanPage } from "@/lib/data/fan-groups";
import { parseOffset } from "@/lib/paging/rules";
import { getClientIp } from "@/lib/security/client-ip";
import { createMemoryLimiter } from "@/lib/security/rate-limit-core";

export const runtime = "nodejs";

const byIp = createMemoryLimiter(30, 60_000);
const SHARED = {
  "Cache-Control": "public, max-age=0, s-maxage=30, stale-while-revalidate=60",
};
const NO_STORE = { "Cache-Control": "no-store" };

export async function GET(request: Request) {
  const gate = byIp(getClientIp(request));
  if (!gate.allowed)
    return NextResponse.json(
      { error: "Too many requests." },
      {
        status: 429,
        headers: { ...NO_STORE, "Retry-After": String(gate.retryAfterSeconds) },
      },
    );

  const offset = parseOffset(new URL(request.url).searchParams.get("offset"));
  if (!offset.ok)
    return NextResponse.json(
      { error: "Invalid request." },
      { status: 400, headers: NO_STORE },
    );

  return NextResponse.json(await getFanPage(offset.value), { headers: SHARED });
}
