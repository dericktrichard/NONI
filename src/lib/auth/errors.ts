export class SessionError extends Error {}

const WRONG_LOGIN = "Email or password is incorrect.";

const MESSAGES: Record<string, string> = {
  "auth/invalid-credential": WRONG_LOGIN,
  "auth/wrong-password": WRONG_LOGIN,
  "auth/user-not-found": WRONG_LOGIN,
  "auth/invalid-email": "Enter a valid email address.",
  "auth/weak-password": "Choose a longer password.",
  "auth/email-already-in-use": "Could not create the account. Try signing in instead.",
  "auth/too-many-requests": "Too many attempts. Wait a few minutes and try again.",
  "auth/network-request-failed": "Network error. Check your connection.",
  "auth/popup-blocked": "Your browser blocked the sign-in window. Allow pop-ups and try again.",
  "auth/user-disabled": "This account is disabled.",
};

const SILENT = new Set(["auth/popup-closed-by-user", "auth/cancelled-popup-request"]);

export function describeAuthError(error: unknown): string {
  if (error instanceof SessionError) return "Could not start your session. Try again.";
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String((error as { code: unknown }).code)
      : "";
  if (SILENT.has(code)) return "";
  return MESSAGES[code] ?? "Something went wrong. Try again.";
}