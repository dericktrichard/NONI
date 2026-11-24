import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { deleteAccount } from "@/lib/data/account-delete";
import { guardWrite, type Rule } from "@/lib/security/guard";
import { roleOf } from "@/lib/security/roles";
import { SESSION_COOKIE, cookieOptions } from "@/lib/security/session";
import { deleteAccountSchema, signedInRecently } from "@/lib/validation/account";

export const runtime = "nodejs";

const NO_STORE = { "Cache-Control": "no-store" };
const RULE: Rule = { scope: "account-delete", limit: 3, windowMs: 60 * 60_000 };

const refuse = (status: number, error: string) =>
  NextResponse.json({ error }, { status, headers: NO_STORE });

export async function POST(request: Request) {
  const guarded = await guardWrite(request, RULE, deleteAccountSchema, 256);
  if (!guarded.ok) return guarded.response;
  const { user } = guarded;

  if (roleOf(user) !== "user")
    return refuse(403, "Staff accounts must be demoted before they can be deleted.");
  if (!signedInRecently(user.auth_time, Date.now()))
    return refuse(401, "For your security, sign out and sign in again, then try again.");

  try {
    const { handle } = await deleteAccount(user.uid);
    if (handle) revalidatePath(`/u/${handle}`);
    revalidatePath("/leaderboard");
    const response = NextResponse.json({ ok: true }, { headers: NO_STORE });
    response.cookies.set(SESSION_COOKIE, "", { ...cookieOptions, maxAge: 0 });
    return response;
  } catch (error) {
    console.error("account delete failed", error);
    return refuse(500, "Could not delete the account. Try again.");
  }
}
