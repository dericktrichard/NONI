import { readFileSync } from "node:fs";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import {
  collection,
  collectionGroup,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  setDoc,
  where,
} from "firebase/firestore";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";

let env: RulesTestEnvironment;

beforeAll(async () => {
  // Host and port come from FIRESTORE_EMULATOR_HOST, set by emulators:exec
  env = await initializeTestEnvironment({
    projectId: "demo-noni",
    firestore: { rules: readFileSync("firebase/firestore.rules", "utf8") },
  });
});

afterAll(async () => {
  await env.cleanup();
});

beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, "characters/goku"), { name: "Goku", score: 100 });
    await setDoc(doc(db, "characters/goku/feats/f1"), {
      status: "verified",
      authorId: "alice",
      netScore: 3,
    });
    await setDoc(doc(db, "characters/goku/feats/f2"), {
      status: "rejected",
      authorId: "alice",
      netScore: -5,
    });
    await setDoc(doc(db, "characters/goku/feats/f1/votes/alice"), {
      uid: "alice",
      characterId: "goku",
      featId: "f1",
      value: 1,
    });
    await setDoc(doc(db, "users/alice"), { displayName: "Alice", reputation: 10 });
  });
});

const anon = () => env.unauthenticatedContext().firestore();
const as = (uid: string, claims?: Record<string, unknown>) =>
  env.authenticatedContext(uid, claims).firestore();

describe("reads", () => {
  it("allows public character reads only with a sane page size", async () => {
    await assertSucceeds(getDocs(query(collection(anon(), "characters"), limit(20))));
    await assertFails(getDocs(collection(anon(), "characters")));
    await assertFails(getDocs(query(collection(anon(), "characters"), limit(500))));
  });

  it("hides rejected feats from the public but not from staff", async () => {
    await assertSucceeds(getDoc(doc(anon(), "characters/goku/feats/f1")));
    await assertFails(getDoc(doc(anon(), "characters/goku/feats/f2")));
    await assertSucceeds(
      getDoc(doc(as("mod", { role: "moderator" }), "characters/goku/feats/f2")),
    );
  });

  it("requires feat list queries to filter by public status", async () => {
    const feats = collection(anon(), "characters/goku/feats");
    await assertSucceeds(
      getDocs(query(feats, where("status", "in", ["pending", "verified"]), limit(20))),
    );
    await assertFails(getDocs(query(feats, limit(20))));
  });
});

describe("votes", () => {
  it("lets owners read their own vote and nobody else's", async () => {
    await assertSucceeds(getDoc(doc(as("alice"), "characters/goku/feats/f1/votes/alice")));
    await assertFails(getDoc(doc(as("bob"), "characters/goku/feats/f1/votes/alice")));
  });

  it("returns 'does not exist' instead of an error for your own missing vote", async () => {
    await assertSucceeds(getDoc(doc(as("bob"), "characters/goku/feats/f1/votes/bob")));
  });

  it("allows 'my votes' collection group queries only for yourself", async () => {
    const mine = (uid: string, asUid: string) =>
      getDocs(
        query(collectionGroup(as(asUid), "votes"), where("uid", "==", uid), limit(50)),
      );
    await assertSucceeds(mine("alice", "alice"));
    await assertFails(mine("alice", "bob"));
  });
});

describe("writes", () => {
  it("blocks every client write, including signed-in users and staff", async () => {
    const alice = as("alice");
    await assertFails(setDoc(doc(alice, "characters/new"), { name: "X", score: 9999 }));
    await assertFails(setDoc(doc(alice, "characters/goku"), { score: 1 }, { merge: true }));
    await assertFails(setDoc(doc(alice, "users/alice"), { reputation: 9999 }));
    await assertFails(
      setDoc(doc(alice, "characters/goku/feats/f1/votes/alice"), { uid: "alice", value: 1 }),
    );
    await assertFails(
      setDoc(doc(as("mod", { role: "admin" }), "characters/goku"), { score: 1 }),
    );
  });

  it("denies the server-only collections", async () => {
    await assertFails(getDoc(doc(as("alice"), "_rateLimits/alice")));
    await assertFails(getDoc(doc(as("alice"), "handles/alice")));
  });
});