import { NextResponse } from "next/server";
import { fetchCharacters } from "@/lib/data/characters";
import { parseCharacterQuery } from "@/lib/data/query";

export const runtime = "nodejs";

/**
 * Public, read-only, and cacheable. Rankings only change when a snapshot runs, so a
 * CDN can answer repeat requests without touching Firestore. Browse pages are cached
 * for five minutes and searches for one. Cache lifetimes are the main lever on read costs.
 */
const BROWSE_CACHE = "public, s-maxage=300, stale-while-revalidate=600";
const SEARCH_CACHE = "public, s-maxage=60, stale-while-revalidate=120";
const NO_CACHE = "no-store";

export async function GET(request: Request) {
  const parsed = parseCharacterQuery(new URL(request.url).searchParams);

  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400, headers: { "Cache-Control": NO_CACHE } });
  }

  try {
    const page = await fetchCharacters(parsed.plan);
    const cache = parsed.plan.facet.kind === "search" ? SEARCH_CACHE : BROWSE_CACHE;
    return NextResponse.json(page, { headers: { "Cache-Control": cache } });
  } catch (error) {
    // Details stay in the server log. The caller only learns that it failed.
    console.error("characters query failed", error);
    return NextResponse.json(
      { error: "Could not load characters." },
      { status: 500, headers: { "Cache-Control": NO_CACHE } },
    );
  }
}
