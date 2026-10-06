import "server-only";
import { getApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { adminDb } from "@/lib/firebase/admin";

export function adminAuth() {
  adminDb();
  return getAuth(getApp());
}