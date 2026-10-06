import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase/client";
import { SessionError } from "@/lib/auth/errors";

async function exchange(user: User): Promise<void> {
  const idToken = await user.getIdToken(true);
  const response = await fetch("/api/auth/session", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ idToken }),
    credentials: "same-origin",
  });
  if (!response.ok) throw new SessionError();
}

async function finish(user: User): Promise<void> {
  try {
    await exchange(user);
  } finally {
    await signOut(getFirebaseAuth());
  }
}

export async function signInWithGoogle(): Promise<void> {
  const { user } = await signInWithPopup(getFirebaseAuth(), new GoogleAuthProvider());
  await finish(user);
}

export async function signInWithEmail(email: string, password: string): Promise<void> {
  const { user } = await signInWithEmailAndPassword(getFirebaseAuth(), email, password);
  await finish(user);
}

export async function signUpWithEmail(email: string, password: string): Promise<void> {
  const { user } = await createUserWithEmailAndPassword(getFirebaseAuth(), email, password);
  try {
    await sendEmailVerification(user);
  } catch {}
  await finish(user);
}

export async function requestPasswordReset(email: string): Promise<void> {
  try {
    await sendPasswordResetEmail(getFirebaseAuth(), email);
  } catch (error) {
    const code = (error as { code?: string }).code;
    if (code !== "auth/user-not-found" && code !== "auth/invalid-email") throw error;
  }
}

export async function signOutEverywhere(): Promise<void> {
  await fetch("/api/auth/session", { method: "DELETE", credentials: "same-origin" });
}