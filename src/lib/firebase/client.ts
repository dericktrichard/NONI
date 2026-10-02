import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from "firebase/firestore";
import { publicEnv } from "@/lib/env.public";

/** Singleton: Next.js hot reload re-runs modules, and a second initializeApp would throw */
const app: FirebaseApp = getApps().length ? getApp() : initializeApp(publicEnv);

let db: Firestore | undefined;
let auth: Auth | undefined;

export function getFirebaseAuth(): Auth {
  return (auth ??= getAuth(app));
}

/**
 * In the browser we enable the persistent IndexedDB cache, shared across tabs.
 * This is what gives the PWA instant repeat loads and offline reads, and it
 * cuts Firestore read costs because cached documents are not billed again.
 */
export function getDb(): Firestore {
  if (db) return db;

  if (typeof window === "undefined") {
    return (db = getFirestore(app));
  }

  try {
    db = initializeFirestore(app, {
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
    });
  } catch {
    // Already initialized (hot reload), reuse the existing instance
    db = getFirestore(app);
  }
  return db;
}