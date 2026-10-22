import "server-only";
import { createHash } from "node:crypto";
import { AwsClient } from "aws4fetch";
import { getR2Env } from "@/lib/env.r2";

export async function putImage(slug: string, data: Buffer): Promise<string> {
  const env = getR2Env();
  const hash = createHash("sha256").update(data).digest("hex").slice(0, 20);
  const key = `characters/${slug}/${hash}.webp`;

  const client = new AwsClient({
    accessKeyId: env.accessKeyId,
    secretAccessKey: env.secretAccessKey,
    service: "s3",
    region: "auto",
  });

  const response = await client.fetch(`https://${env.accountId}.r2.cloudflarestorage.com/${env.bucket}/${key}`, {
    method: "PUT",
    headers: { "content-type": "image/webp", "cache-control": "public, max-age=31536000, immutable" },
    body: new Uint8Array(data),
  });
  if (!response.ok) throw new Error(`R2 upload failed with status ${response.status}`);

  return `${env.publicUrl}/${key}`;
}