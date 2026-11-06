import { NextResponse } from "next/server";
import { HttpError } from "@/lib/data/feats";
import { readFavourite, setFavourite } from "@/lib/data/favourites";
import { SLUG_RE } from "@/lib/firebase/paths";
import { guardWrite, type Rule } from "@/lib/security/guard";
import { getSessionUser } from "@/lib/security/session";
import { favouriteSchema } from "@/lib/validation/favourite";

export const runtime = "nodejs";

const NO_STORE = { "Cache-Control": "no-store" };
const RULE: Rule = { scope: "favourite", limit: 60, windowMs: 60 * 60_000 };

const reply = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: NO_STORE });

function failure(error: unknown) {
  if (error instanceof HttpError) return reply({ error: error.message }, error.status);
  console.error("favourite failed", error);
  return reply({ error: "Something went wrong." }, 500);
}

export async function GET(request: Request) {
  const characterId = new URL(request.url).searchParams.get("characterId") ?? "";
  if (characterId.length > 80 || !SLUG_RE.test(characterId)) return reply({ error: "Invalid request." }, 400);

  const viewer = await getSessionUser();
  if (!viewer) return reply({ error: "Sign in required." }, 401);

  try {
    return reply(await readFavourite(viewer.uid, characterId));
  } catch (error) {
    return failure(error);
  }
}

export async function PUT(request: Request) {
  const guarded = await guardWrite(request, RULE, favouriteSchema, 512);
  if (!guarded.ok) return guarded.response;

  try {
    return reply(await setFavourite(guarded.user.uid, guarded.body.characterId, guarded.body.value));
  } catch (error) {
    return failure(error);
  }
}