import "server-only";
import { createHash } from "node:crypto";
import { AwsClient } from "aws4fetch";
import { getR2Env } from "@/lib/env.r2";

export async function putImage(slug: string, data: Buffer): Promise<string> {
  const env = getR2Env();
  const hash = createHash("sha256").update(data).digest("hex").slice(0, 20);
  const key = `characters/${slug}/${hash}.webp`;
  const url = `https://${env.accountId}.r2.cloudflarestorage.com/${env.bucket}/${key}`;

  const client = new AwsClient({
    accessKeyId: env.accessKeyId,
    secretAccessKey: env.secretAccessKey,
    service: "s3",
    region: "auto",
  });

  const body = new Uint8Array(data);
  const headers = { "content-type": "image/webp", "cache-control": "public, max-age=31536000, immutable" };

  const signed = await client.sign(url, { method: "PUT", headers, body });
  const response = await fetch(signed.url, { method: "PUT", headers: signed.headers, body });
  if (!response.ok) throw new Error(`R2 upload failed with status ${response.status}`);

  return `${env.publicUrl}/${key}`;
}