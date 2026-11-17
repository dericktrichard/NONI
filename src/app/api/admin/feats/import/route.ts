import { NextResponse } from "next/server";
import { z } from "zod";
import { commitFeatImport, reviewFeatImport } from "@/lib/data/admin-feat-import";
import { HttpError } from "@/lib/data/feats";
import { FEAT_IMPORT } from "@/lib/import/feats";
import { guardWrite, type Rule } from "@/lib/security/guard";

export const runtime = "nodejs";

const NO_STORE = { "Cache-Control": "no-store" };
const RULE: Rule = {
  scope: "admin-feat-import",
  limit: 30,
  windowMs: 60 * 60_000,
  role: "admin",
};
const schema = z
  .object({
    op: z.enum(["preview", "commit"]),
    text: z.string().max(FEAT_IMPORT.maxBytes),
  })
  .strict();

const reply = (body: unknown, status = 200) =>
  NextResponse.json(body, { status, headers: NO_STORE });

export async function POST(request: Request) {
  const guarded = await guardWrite(request, RULE, schema, FEAT_IMPORT.maxBytes + 2048);
  if (!guarded.ok) return guarded.response;

  try {
    if (guarded.body.op === "preview") {
      const { items } = await reviewFeatImport(guarded.body.text);
      return reply({ items });
    }
    return reply(await commitFeatImport(guarded.user.uid, guarded.body.text));
  } catch (error) {
    if (error instanceof HttpError) return reply({ error: error.message }, error.status);
    console.error("feat import failed", error);
    return reply({ error: "Something went wrong." }, 500);
  }
}
