export const IMAGE_KINDS = ["avatar", "banner"] as const;
export type ImageKind = (typeof IMAGE_KINDS)[number];

export const IMAGE_REPORT_REASONS = [
  "sexual",
  "abusive",
  "harassment",
  "illegal",
  "other",
] as const;
export type ImageReportReason = (typeof IMAGE_REPORT_REASONS)[number];

export const IMAGE_REPORT_LABELS: Record<ImageReportReason, string> = {
  sexual: "Sexual content",
  abusive: "Abusive or hateful",
  harassment: "Harassment or someone's likeness",
  illegal: "Illegal content",
  other: "Something else",
};

export const IMAGE_MOD_ACTIONS = ["remove", "block", "dismiss"] as const;
export type ImageModAction = (typeof IMAGE_MOD_ACTIONS)[number];
