import { NextResponse } from "next/server";
import { HttpError } from "@/lib/data/feats";
import { saveUpload } from "@/lib/data/profile-look";
import { guardRequest } from "@/lib/security/guard";
import { detectImageType } from "@/lib/storage/image-type";
import { PROFILE_IMAGE, processProfileImage } from "@/lib/storage/images";

export const runtime = "nodejs";

const RULE = { scope: "profile-image", limit: 20, windowMs: 60 * 60_000 } as const;

const reply = (body: unknown, status = 200) =>
  NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(request: Request) {
  const checked = await guardRequest(request, RULE);
  if (!checked.ok) return checked.response;

  const declared = Number(request.headers.get("content-length"));
  if (
    !Number.isFinite(declared) ||
    declared <= 0 ||
    declared > PROFILE_IMAGE.maxBytes + 8192
  ) {
    return reply({ error: "That image is too large." }, 413);
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return reply({ error: "Invalid request." }, 400);
  }

  const kind = form.get("kind");
  const file = form.get("file");
  if (kind !== "avatar" && kind !== "banner")
    return reply({ error: "Invalid request." }, 400);
  if (!(file instanceof File) || file.size === 0)
    return reply({ error: "Invalid request." }, 400);
  if (file.size > PROFILE_IMAGE.maxBytes)
    return reply({ error: "That image is too large." }, 413);

  const input = Buffer.from(await file.arrayBuffer());
  if (!detectImageType(input))
    return reply({ error: "Use a JPEG, PNG or WebP image." }, 415);

  let output: Buffer;
  try {
    output = await processProfileImage(input, kind);
  } catch {
    return reply({ error: "Could not read that image." }, 422);
  }

  try {
    return reply({ url: await saveUpload(checked.user.uid, kind, output) });
  } catch (error) {
    if (error instanceof HttpError) return reply({ error: error.message }, error.status);
    console.error("profile image upload failed", error);
    return reply({ error: "Could not store the image." }, 502);
  }
}
