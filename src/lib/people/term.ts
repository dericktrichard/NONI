import { HANDLE_MAX } from "@/lib/profile/handle";

const TERM = /^[a-z0-9][a-z0-9_.-]*$/;

/** A typed handle ("@Aprel") cleaned for prefix search, or null when it is not worth searching */
export function peopleTerm(raw: string): string | null {
  const term = raw.trim().toLowerCase().replace(/^@/, "");
  return term.length >= 2 && term.length <= HANDLE_MAX && TERM.test(term) ? term : null;
}
