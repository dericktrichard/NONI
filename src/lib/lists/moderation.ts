export const LIST_REPORT_REASONS = [
  "spam",
  "abusive",
  "harassment",
  "illegal",
  "other",
] as const;
export type ListReportReason = (typeof LIST_REPORT_REASONS)[number];

export const LIST_REPORT_LABELS: Record<ListReportReason, string> = {
  spam: "Spam",
  abusive: "Abusive or hateful",
  harassment: "Harassment of a person",
  illegal: "Illegal content",
  other: "Something else",
};

export const LIST_MOD_ACTIONS = ["hide", "restore", "dismiss"] as const;
export type ListModAction = (typeof LIST_MOD_ACTIONS)[number];
export type ListStatus = "visible" | "hidden";

export function nextListStatus(
  action: ListModAction,
  status: ListStatus,
): ListStatus | null {
  if (action === "hide") return status === "visible" ? "hidden" : null;
  if (action === "restore") return status === "hidden" ? "visible" : null;
  return status === "visible" ? "visible" : null;
}
