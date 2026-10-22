import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { rerankAll } from "@/lib/data/rerank";

async function main(): Promise<number> {
  const args = process.argv.slice(2);
  const write = args.includes("--write");
  const confirmed = args.find((arg) => arg.startsWith("--project="))?.slice("--project=".length);

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    console.error("Missing FIREBASE_ADMIN_* values. Run this with npm run rerank.");
    return 1;
  }
  if (write && confirmed !== projectId) {
    console.error(`Refusing to write. Add --project=${projectId} to confirm the target.`);
    return 1;
  }

  const app = getApps()[0] ?? initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
  const result = await rerankAll(getFirestore(app), { dryRun: !write });

  console.log(`${result.total} characters ranked. ${result.changed} ${write ? "updated" : "would change"}.`);
  if (result.skipped.length > 0) console.log(`Skipped (bad data): ${result.skipped.join(", ")}`);
  if (!write) console.log("Dry run. To save: npm run rerank -- --write --project=<your project id>");
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