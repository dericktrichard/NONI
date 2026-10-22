import { NextResponse } from "next/server";
import { SLUG_RE } from "@/lib/firebase/paths";
import { guardRequest } from "@/lib/security/guard";
import { detectImageType } from "@/lib/storage/image-type";
import { IMAGE, processImage } from "@/lib/storage/images";
import { putImage } from "@/lib/storage/r2";

export const runtime = "nodejs";

const RULE = { scope: "admin-image", limit: 30, windowMs: 60 * 60_000, role: "admin" } as const;

const reply = (body: unknown, status = 200) =>
  NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(request: Request) {
  const checked = await guardRequest(request, RULE);
  if (!checked.ok) return checked.response;

  const declared = Number(request.headers.get("content-length"));
  if (!Number.isFinite(declared) || declared <= 0 || declared > IMAGE.maxBytes + 8192) {
    return reply({ error: "Image must be under 4 MB." }, 413);
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return reply({ error: "Invalid request." }, 400);
  }

  const slug = form.get("slug");
  const file = form.get("file");
  if (typeof slug !== "string" || slug.length > 80 || !SLUG_RE.test(slug)) return reply({ error: "Invalid request." }, 400);
  if (!(file instanceof File) || file.size === 0) return reply({ error: "Invalid request." }, 400);
  if (file.size > IMAGE.maxBytes) return reply({ error: "Image must be under 4 MB." }, 413);

  const input = Buffer.from(await file.arrayBuffer());
  if (!detectImageType(input)) return reply({ error: "Use a JPEG, PNG or WebP image." }, 415);

  let output: Buffer;
  try {
    output = await processImage(input);
  } catch {
    return reply({ error: "Could not read that image." }, 422);
  }

  try {
    return reply({ url: await putImage(slug, output) });
  } catch (error) {
    console.error("image upload failed", error);
    return reply({ error: "Could not store the image." }, 502);
  }
}