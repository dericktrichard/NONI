import "server-only";
import { adminDb } from "@/lib/firebase/admin";
import { COL } from "@/lib/firebase/paths";

export interface HeroSettings {
  imageUrl: string;
  credit: string;
  focalX: number;
  focalY: number;
}

const ALLOWED_PATHS = ["/characters/", "/site/"];

function allowedImage(url: string): boolean {
  const base = process.env.R2_PUBLIC_URL;
  if (!base) return false;
  try {
    const target = new URL(url);
    return target.host === new URL(base).host && ALLOWED_PATHS.some((prefix) => target.pathname.startsWith(prefix));
  } catch {
    return false;
  }
}

function percent(value: unknown, fallback: number): number {
  const number = typeof value === "number" ? value : Number.NaN;
  return Number.isFinite(number) ? Math.min(100, Math.max(0, number)) : fallback;
}

export async function fetchHero(): Promise<HeroSettings | null> {
  try {
    const snap = await adminDb().collection(COL.settings).doc("hero").get();
    if (!snap.exists) return null;
    const imageUrl = snap.get("imageUrl");
    if (typeof imageUrl !== "string" || !allowedImage(imageUrl)) return null;
    return {
      imageUrl,
      credit: String(snap.get("credit") ?? ""),
      focalX: percent(snap.get("focalX"), 50),
      focalY: percent(snap.get("focalY"), 30),
    };
  } catch (error) {
    console.error("hero settings failed", error);
    return null;
  }
}