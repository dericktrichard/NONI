import { cert, getApps, initializeApp } from "firebase-admin/app";
import { Timestamp, getFirestore } from "firebase-admin/firestore";
import { MOCK_SEEDS } from "@/config/mock-characters";
import { COL } from "@/lib/firebase/paths";
import { buildCharacterDocs } from "@/lib/ranking/character-doc";

const MAX_BATCH = 400;

async function main(): Promise<number> {
  const args = process.argv.slice(2);
  const write = args.includes("--write");
  const confirmed = args.find((arg) => arg.startsWith("--project="))?.slice("--project=".length);
  const docs = buildCharacterDocs(MOCK_SEEDS);

  if (docs.length > MAX_BATCH) {
    console.error(`Too many documents for one batch (${docs.length}).`);
    return 1;
  }

  console.log(`${docs.length} characters, ranked by the engine:`);
  for (const doc of docs) {
    console.log(
      `  ${String(doc.rank).padStart(2)}  ${doc.slug.padEnd(18)} ${doc.tier.padEnd(9)} ${doc.speed.padEnd(22)} ${doc.score}`,
    );
  }

  if (!write) {
    console.log("\nDry run. To save: npm run seed -- --write --project=<your project id>");
    return 0;
  }

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    console.error("\nMissing FIREBASE_ADMIN_* values. Run this with npm run seed.");
    return 1;
  }
  if (confirmed !== projectId) {
    console.error(`\nRefusing to write. Add --project=${projectId} to confirm the target.`);
    return 1;
  }

  const app = getApps()[0] ?? initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
  const db = getFirestore(app);

  const refs = docs.map((doc) => db.collection(COL.characters).doc(doc.slug));
  const existing = await db.getAll(...refs);
  const now = Timestamp.now();

  const batch = db.batch();
  docs.forEach((doc, i) => {
    const createdAt = existing[i].exists ? (existing[i].get("createdAt") ?? now) : now;
    batch.set(refs[i], { ...doc, createdAt, updatedAt: now });
  });
  await batch.commit();

  console.log(`\nWrote ${docs.length} documents to ${projectId}.`);
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