import "server-only";
import { z } from "zod";

const schema = z.object({
  accountId: z.string().min(1),
  accessKeyId: z.string().min(1),
  secretAccessKey: z.string().min(1),
  bucket: z.string().min(1),
  publicUrl: z.string().url().startsWith("https://"),
});

export function getR2Env() {
  const env = schema.parse({
    accountId: process.env.R2_ACCOUNT_ID,
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    bucket: process.env.R2_BUCKET,
    publicUrl: process.env.R2_PUBLIC_URL,
  });
  return { ...env, publicUrl: env.publicUrl.replace(/\/+$/, "") };
}