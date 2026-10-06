import { NextResponse } from "next/server";
import { fetchCharacters } from "@/lib/data/characters";
import { isCanonicalSearch, parseCharacterQuery } from "@/lib/data/query";

export const runtime = "nodejs";

const BROWSE_CACHE = "public, s-maxage=300, stale-while-revalidate=600";
const SEARCH_CACHE = "public, s-maxage=60, stale-while-revalidate=120";
const NO_CACHE = "no-store";

const reject = (error: string, status: number) =>
  NextResponse.json({ error }, { status, headers: { "Cache-Control": NO_CACHE } });

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = parseCharacterQuery(url.searchParams);

  if (!parsed.ok) return reject(parsed.error, 400);
  if (!isCanonicalSearch(url.search, parsed.plan)) return reject("Query is not in canonical form.", 400);

  try {
    const page = await fetchCharacters(parsed.plan);
    const cache = parsed.plan.facet.kind === "search" ? SEARCH_CACHE : BROWSE_CACHE;
    return NextResponse.json(page, { headers: { "Cache-Control": cache } });
  } catch (error) {
    console.error("characters query failed", error);
    return reject("Could not load characters.", 500);
  }
}