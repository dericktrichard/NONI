/**
 * Loads the sample roster into Firestore through the ranking engine.
 *
 *   npm run seed              dry run: prints what would be written
 *   npm run seed -- --write   writes to the project named in .env.local
 *
 * Development tool only. It overwrites whole character documents, so do not run
 * it against a database that holds real, server-written data.
 */
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { Timestamp, getFirestore } from "firebase-admin/firestore";
import { MOCK_SEEDS } from "@/config/mock-characters";
import { COL } from "@/lib/firebase/paths";
import { buildCharacterDocs } from "@/lib/ranking/character-doc";

const MAX_BATCH = 400;

async function main(): Promise<number> {
  const write = process.argv.includes("--write");
  const docs = buildCharacterDocs(MOCK_SEEDS);

  if (docs.length > MAX_BATCH) {
    console.error(`Too many documents for one batch (${docs.length}). Split the seed first.`);
    return 1;
  }

  console.log(`${docs.length} characters, ranked by the engine:`);
  for (const doc of docs) {
    console.log(
      `  ${String(doc.rank).padStart(2)}  ${doc.slug.padEnd(18)} ${doc.tier.padEnd(9)} ${doc.speed.padEnd(22)} ${doc.score}`,
    );
  }

  if (!write) {
    console.log("\nDry run. Add --write to save these to Firestore.");
    return 0;
  }

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!projectId || !clientEmail || !privateKey) {
    console.error("\nMissing FIREBASE_ADMIN_* values. Run this with npm run seed so .env.local is loaded.");
    return 1;
  }

  const app = getApps()[0] ?? initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
  const db = getFirestore(app);
  console.log(`\nWriting to project ${projectId}`);

  const refs = docs.map((doc) => db.collection(COL.characters).doc(doc.slug));
  const existing = await db.getAll(...refs);
  const now = Timestamp.now();

  const batch = db.batch();
  docs.forEach((doc, i) => {
    const createdAt = existing[i].exists ? (existing[i].get("createdAt") ?? now) : now;
    batch.set(refs[i], { ...doc, createdAt, updatedAt: now });
  });
  await batch.commit();

  console.log(`Wrote ${docs.length} documents.`);
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
