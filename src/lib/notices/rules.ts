import { tierOf } from "@/lib/standing/rules";
import type { BoardKey } from "@/lib/standing/types";

export const NOTICE = {
  /** Notices kept in the inbox view */
  keep: 20,
} as const;

export const BOARD_LABEL: Record<BoardKey, string> = {
  glaze: "Highest Glaze",
  week: "This week",
  champions: "Champions",
};

export interface Top {
  uid: string;
  value: number;
}

export interface Takeover {
  gained: boolean;
  /** The player who was No. 1 and has just been passed */
  overtaken: string | null;
}

/**
 * Whether a player with `mine` has just taken first place from `before`.
 * Equal scores share first place, so only passing the leader counts.
 */
export function takeover(
  me: string,
  before: Top | null,
  mine: number,
  min = 1,
): Takeover {
  if (mine < min) return { gained: false, overtaken: null };
  if (before === null) return { gained: true, overtaken: null };
  if (before.uid === me || mine <= before.value)
    return { gained: false, overtaken: null };
  return { gained: true, overtaken: before.uid };
}

/** The fan tier reached when a score goes from `before` to `after`, or null if the tier did not change */
export function reachedTier(before: number, after: number): string | null {
  const tier = tierOf(after);
  return tier !== null && tier !== tierOf(before) ? tier : null;
}
