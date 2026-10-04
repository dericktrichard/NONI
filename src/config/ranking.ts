export const VERIFICATION = {
  minUpvotes: 5,
  verifyRatio: 0.75,
  /** Lower than verifyRatio on purpose, so a verified feat does not flap */
  keepVerifiedRatio: 0.6,
  minDownvotes: 5,
  rejectRatio: 0.25,
} as const;

export const VERSE = {
  minCharacters: 3,
  topN: 5,
  peakWeight: 0.6,
} as const;

export const PROOF = {
  videoHosts: ["youtube.com", "youtu.be", "vimeo.com", "bilibili.com", "dailymotion.com"],
  /** Shorteners hide the destination, so they are not accepted as proof */
  blockedHosts: ["bit.ly", "t.co", "tinyurl.com", "goo.gl", "is.gd", "ow.ly", "cutt.ly", "rb.gy"],
  maxUrlLength: 2048,
  excerptMin: 20,
} as const;
