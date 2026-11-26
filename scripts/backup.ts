import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import {
  DocumentReference,
  GeoPoint,
  Timestamp,
  getFirestore,
  type CollectionReference,
} from "firebase-admin/firestore";

const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");

if (!projectId || !clientEmail || !privateKey) {
  console.error("Missing FIREBASE_ADMIN_* values in .env.local");
  process.exit(1);
}

if (getApps().length === 0) {
  initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
}
const db = getFirestore();

interface Dump {
  id: string;
  data: unknown;
  sub?: Record<string, Dump[]>;
}

function encode(value: unknown): unknown {
  if (value instanceof Timestamp) return { __timestamp: value.toDate().toISOString() };
  if (value instanceof GeoPoint) return { __geopoint: [value.latitude, value.longitude] };
  if (value instanceof DocumentReference) return { __ref: value.path };
  if (Buffer.isBuffer(value)) return { __bytes: value.toString("base64") };
  if (Array.isArray(value)) return value.map(encode);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, encode(v)]),
    );
  }
  return value;
}

async function dump(collection: CollectionReference): Promise<Dump[]> {
  const snapshot = await collection.get();
  const out: Dump[] = [];
  for (const doc of snapshot.docs) {
    const entry: Dump = { id: doc.id, data: encode(doc.data()) };
    const subs = await doc.ref.listCollections();
    if (subs.length > 0) {
      entry.sub = {};
      for (const sub of subs) entry.sub[sub.id] = await dump(sub);
    }
    out.push(entry);
  }
  return out;
}

async function main() {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const dir = join("backups", stamp);
  if (existsSync(dir)) throw new Error("Backup folder already exists: " + dir);
  mkdirSync(dir, { recursive: true });

  console.log("Backing up project " + projectId + " to " + dir);
  const collections = await db.listCollections();
  let total = 0;
  for (const collection of collections) {
    const docs = await dump(collection);
    total += docs.length;
    writeFileSync(join(dir, collection.id + ".json"), JSON.stringify(docs, null, 2));
    console.log("  " + collection.id + ": " + docs.length + " documents");
  }
  console.log("Done. " + total + " top-level documents. Keep this folder private.");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
