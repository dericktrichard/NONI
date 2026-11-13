export const PAGE = 6;
export const MAX_OFFSET = 500;

export interface Page<T, N> {
  items: T[];
  /** What to ask for next, or null when there is nothing more */
  next: N | null;
}

type Parsed<T> = { ok: true; value: T } | { ok: false };

const CURSOR_RE = /^[A-Za-z0-9]{10,40}$/;

/** A missing cursor means the first page */
export function parseCursor(raw: string | null): Parsed<string | null> {
  if (raw === null || raw === "") return { ok: true, value: null };
  return CURSOR_RE.test(raw) ? { ok: true, value: raw } : { ok: false };
}

/** A missing offset means the first page */
export function parseOffset(raw: string | null): Parsed<number> {
  if (raw === null || raw === "") return { ok: true, value: 0 };
  if (!/^\d{1,4}$/.test(raw)) return { ok: false };
  const value = Number(raw);
  return value <= MAX_OFFSET ? { ok: true, value } : { ok: false };
}
