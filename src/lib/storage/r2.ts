import "server-only";
import { createHash } from "node:crypto";
import { AwsClient } from "aws4fetch";
import { getR2Env } from "@/lib/env.r2";

const USER_KEY = /^users\/[A-Za-z0-9_-]+\/(avatar|banner)\/[0-9a-f]{20}\.webp$/;

function connect() {
  const env = getR2Env();
  const client = new AwsClient({
    accessKeyId: env.accessKeyId,
    secretAccessKey: env.secretAccessKey,
    service: "s3",
    region: "auto",
  });
  return {
    env,
    client,
    object: (key: string) =>
      `https://${env.accountId}.r2.cloudflarestorage.com/${env.bucket}/${key}`,
  };
}

const digest = (data: Buffer) =>
  createHash("sha256").update(data).digest("hex").slice(0, 20);

async function put(key: string, data: Buffer): Promise<string> {
  const { env, client, object } = connect();
  const body = new Uint8Array(data);
  const headers = {
    "content-type": "image/webp",
    "cache-control": "public, max-age=31536000, immutable",
  };

  const signed = await client.sign(object(key), { method: "PUT", headers, body });
  const response = await fetch(signed.url, {
    method: "PUT",
    headers: signed.headers,
    body,
  });
  if (!response.ok) throw new Error(`R2 upload failed with status ${response.status}`);

  return `${env.publicUrl}/${key}`;
}

export const putImage = (slug: string, data: Buffer) =>
  put(`characters/${slug}/${digest(data)}.webp`, data);

export const putUserImage = (uid: string, kind: "avatar" | "banner", data: Buffer) =>
  put(`users/${uid}/${kind}/${digest(data)}.webp`, data);

/** Deletes an image this app stored for a user. Any other address is ignored. */
export async function deleteUserImage(url: string): Promise<void> {
  const { env, client, object } = connect();
  if (!url.startsWith(`${env.publicUrl}/`)) return;
  const key = url.slice(env.publicUrl.length + 1);
  if (!USER_KEY.test(key)) return;

  const signed = await client.sign(object(key), { method: "DELETE" });
  const response = await fetch(signed.url, { method: "DELETE", headers: signed.headers });
  if (!response.ok && response.status !== 404)
    throw new Error(`R2 delete failed with status ${response.status}`);
}
