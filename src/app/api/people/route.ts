import { NextResponse } from "next/server";
import { searchPeople } from "@/lib/data/people";
import { peopleTerm } from "@/lib/people/term";
import { getClientIp } from "@/lib/security/client-ip";
import { createMemoryLimiter } from "@/lib/security/rate-limit-core";

export const runtime = "nodejs";

const NO_STORE = { "Cache-Control": "no-store" };
const byIp = createMemoryLimiter(40, 60_000);

export async function GET(request: Request) {
  const limited = byIp(getClientIp(request));
  if (!limited.allowed) {
    return NextResponse.json(
      { error: "Too many requests." },
      {
        status: 429,
        headers: { ...NO_STORE, "Retry-After": String(limited.retryAfterSeconds) },
      },
    );
  }

  const term = peopleTerm(new URL(request.url).searchParams.get("q") ?? "");
  if (!term) return NextResponse.json({ people: [] }, { headers: NO_STORE });

  try {
    return NextResponse.json({ people: await searchPeople(term) }, { headers: NO_STORE });
  } catch (error) {
    console.error("people search failed", error);
    return NextResponse.json(
      { error: "Could not search people." },
      { status: 500, headers: NO_STORE },
    );
  }
}
