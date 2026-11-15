import { NextResponse } from "next/server";
import { z } from "zod";
import { commitImport, reviewImport } from "@/lib/data/admin-import";
import { HttpError } from "@/lib/data/feats";
import { IMPORT } from "@/lib/import/rows";
import { guardWrite, type Rule } from "@/lib/security/guard";

export const runtime = "nodejs";

const NO_STORE = { "Cache-Control": "no-store" };
const RULE: Rule = {
  scope: "admin-import",
  limit: 30,
  windowMs: 60 * 60_000,
  role: "admin",
};
const schema = z
  .object({
    op: z.enum(["preview", "commit"]),
    text: z.string().max(IMPORT.maxBytes),
  })
  .strict();

const reply = (body: unknown, status = 200) =>
  NextResponse.json(body, { status, headers: NO_STORE });

export async function POST(request: Request) {
  const guarded = await guardWrite(request, RULE, schema, IMPORT.maxBytes + 2048);
  if (!guarded.ok) return guarded.response;

  try {
    if (guarded.body.op === "preview") {
      const { items } = await reviewImport(guarded.body.text);
      return reply({ items });
    }
    return reply(await commitImport(guarded.user.uid, guarded.body.text));
  } catch (error) {
    if (error instanceof HttpError) return reply({ error: error.message }, error.status);
    console.error("character import failed", error);
    return reply({ error: "Something went wrong." }, 500);
  }
}
