import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { endPlus, grantPlus } from "@/lib/plus/grant";

async function main(): Promise<number> {
  const args = process.argv.slice(2);
  const [email, rawDays] = args.filter((arg) => !arg.startsWith("--"));
  const confirmed = args
    .find((arg) => arg.startsWith("--project="))
    ?.slice("--project=".length);
  const days = Number(rawDays);

  if (!email?.includes("@") || !Number.isInteger(days) || days < 0 || days > 366) {
    console.error(
      "Usage: npm run plus -- <email> <days 1-366, or 0 to end Plus> --project=<id>",
    );
    return 1;
  }

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    console.error("Missing FIREBASE_ADMIN_* values. Run this with npm run plus.");
    return 1;
  }
  if (confirmed !== projectId) {
    console.error(`Refusing to run. Add --project=${projectId} to confirm the target.`);
    return 1;
  }

  const app =
    getApps()[0] ??
    initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
  const user = await getAuth(app).getUserByEmail(email);
  const db = getFirestore(app);

  if (days === 0) {
    await endPlus(db, user.uid);
    console.log(`${email} (${user.uid}) no longer has Plus.`);
    return 0;
  }

  const result = await grantPlus(db, user.uid, days);
  console.log(
    `${email} (${user.uid}) has Plus until ${new Date(result.until).toISOString().slice(0, 10)}.` +
      (result.welcome ? " Welcome Glaze added." : ""),
  );
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
