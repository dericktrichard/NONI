/** Daily reward for holding No. 1. Every number lives here. */
export const TOP = {
  best: 200,
  extra: 50,
  cap: 400,
  /** A board or character needs this many players before No. 1 pays */
  minParticipants: 5,
  /** Fan positions also need this many fan points (Superfan) */
  minFanPoints: 100,
} as const;

/** The reward for holding `count` positions: the best one pays in full, each extra pays less, up to a daily cap */
export function topReward(count: number): number {
  if (count <= 0) return 0;
  return Math.min(TOP.cap, TOP.best + TOP.extra * (count - 1));
}
