import { NextResponse } from "next/server";
import { createCharacter } from "@/lib/data/admin-characters";
import { HttpError } from "@/lib/data/feats";
import { guardWrite } from "@/lib/security/guard";
import { createCharacterSchema } from "@/lib/validation/character";

export const runtime = "nodejs";

const RULE = { scope: "admin-character", limit: 60, windowMs: 60 * 60_000, role: "admin" } as const;
const NO_STORE = { "Cache-Control": "no-store" };

export async function POST(request: Request) {
  const guarded = await guardWrite(request, RULE, createCharacterSchema, 32_768);
  if (!guarded.ok) return guarded.response;

  try {
    const id = await createCharacter(guarded.body);
    return NextResponse.json({ id }, { status: 201, headers: NO_STORE });
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json({ error: error.message }, { status: error.status, headers: NO_STORE });
    }
    console.error("character create failed", error);
    return NextResponse.json({ error: "Could not save the character." }, { status: 500, headers: NO_STORE });
  }
}