import { NextResponse } from "next/server";
import { HttpError, submitFeat } from "@/lib/data/feats";
import { isValidClaim } from "@/lib/ranking/profile";
import { parseProofUrl, validateFeatProofs } from "@/lib/ranking/proof";
import { guardWrite } from "@/lib/security/guard";
import { submitFeatSchema } from "@/lib/validation/feat";
import type { Proof } from "@/types/domain";

export const runtime = "nodejs";

const NO_STORE = { "Cache-Control": "no-store" };
const RULE = { scope: "feat-submit", limit: 10, windowMs: 60 * 60_000 };

export async function POST(request: Request) {
  const guarded = await guardWrite(request, RULE, submitFeatSchema, 32_768);
  if (!guarded.ok) return guarded.response;
  const { body, user } = guarded;

  if (!isValidClaim(body.claim)) {
    return NextResponse.json({ error: "Invalid claim." }, { status: 400, headers: NO_STORE });
  }

  const proofs: Proof[] = body.proofs.map((proof) => ({
    type: proof.type,
    url: proof.url,
    locator: proof.locator,
    ...(proof.type === "quote" && proof.excerpt ? { excerpt: proof.excerpt } : {}),
  }));

  const issues = validateFeatProofs(proofs);
  if (issues.length > 0) {
    return NextResponse.json({ error: "Check your proofs.", issues }, { status: 422, headers: NO_STORE });
  }

  const normalised = proofs.map((proof) => ({ ...proof, url: parseProofUrl(proof.url)?.href ?? proof.url }));

  try {
    const id = await submitFeat(user.uid, { ...body, proofs: normalised });
    return NextResponse.json({ id }, { status: 201, headers: NO_STORE });
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json({ error: error.message }, { status: error.status, headers: NO_STORE });
    }
    console.error("feat submit failed", error);
    return NextResponse.json({ error: "Could not save the feat." }, { status: 500, headers: NO_STORE });
  }
}