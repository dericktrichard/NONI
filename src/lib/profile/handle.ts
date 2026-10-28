export const HANDLE_MIN = 3;
export const HANDLE_MAX = 20;
export const HANDLE_COOLDOWN_DAYS = 30;

export const RESERVED_HANDLES: ReadonlySet<string> = new Set([
  "admin",
  "administrator",
  "anonymous",
  "api",
  "help",
  "mod",
  "moderator",
  "noni",
  "null",
  "official",
  "root",
  "staff",
  "support",
  "system",
  "team",
  "undefined",
  "aprel",
]);

export type HandleIssue = "length" | "characters" | "reserved";

export const HANDLE_MESSAGES: Record<HandleIssue, string> = {
  length: `Use ${HANDLE_MIN} to ${HANDLE_MAX} characters.`,
  characters: "Use lowercase letters, numbers and underscores, starting with a letter or number.",
  reserved: "That handle is not available.",
};

const HANDLE_RE = /^[a-z0-9][a-z0-9_]*$/;
const DAY_MS = 86_400_000;

export function normalizeHandle(raw: string): string {
  return raw.trim().replace(/^@/, "").toLowerCase();
}

export function checkHandle(handle: string): HandleIssue | null {
  if (handle.length < HANDLE_MIN || handle.length > HANDLE_MAX) return "length";
  if (!HANDLE_RE.test(handle)) return "characters";
  if (RESERVED_HANDLES.has(handle)) return "reserved";
  return null;
}

export function handleCooldownDays(changedAtMs: number | null, nowMs: number): number {
  if (changedAtMs === null) return 0;
  const remaining = HANDLE_COOLDOWN_DAYS * DAY_MS - (nowMs - changedAtMs);
  return remaining > 0 ? Math.ceil(remaining / DAY_MS) : 0;
}