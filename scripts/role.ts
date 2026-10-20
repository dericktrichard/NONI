import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const ROLES = ["admin", "moderator", "user"];

async function main(): Promise<number> {
  const args = process.argv.slice(2);
  const [email, role] = args.filter((arg) => !arg.startsWith("--"));
  const confirmed = args.find((arg) => arg.startsWith("--project="))?.slice("--project=".length);

  if (!email?.includes("@") || !role || !ROLES.includes(role)) {
    console.error("Usage: npm run role -- <email> <admin|moderator|user> --project=<id>");
    return 1;
  }

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    console.error("Missing FIREBASE_ADMIN_* values. Run this with npm run role.");
    return 1;
  }
  if (confirmed !== projectId) {
    console.error(`Refusing to run. Add --project=${projectId} to confirm the target.`);
    return 1;
  }

  const app = getApps()[0] ?? initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
  const auth = getAuth(app);

  const user = await auth.getUserByEmail(email);
  const claims: Record<string, unknown> = { ...(user.customClaims ?? {}) };
  delete claims.role;
  if (role !== "user") claims.role = role;

  await auth.setCustomUserClaims(user.uid, claims);
  await auth.revokeRefreshTokens(user.uid);

  console.log(`${email} (${user.uid}) is now: ${role}. They must sign in again.`);
  return 0;
}

main().then(
  (code) => {
    process.exitCode = code;
  },
  (error) => {
    console.error(error);
    process.exitCode = 1;
  },
);