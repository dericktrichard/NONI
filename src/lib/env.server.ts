import "server-only";
import { z } from "zod";

const schema = z.object({
  projectId: z.string().min(1),
  clientEmail: z.string().min(1),
  privateKey: z.string().min(1),
});

/** Called lazily so that importing this file never crashes a build */
export function getServerEnv() {
  return schema.parse({
    projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
    clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    // .env files store newlines as the two characters \n, so restore real ones
    privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  });
}