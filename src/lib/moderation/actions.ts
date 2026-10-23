import { decideFeatStatus } from "@/lib/ranking/verification";
import type { FeatStatus } from "@/types/domain";

export const REPORT_REASONS = ["inaccurate", "no-proof", "spam", "abuse", "other"] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];

export const REPORT_REASON_LABELS: Record<ReportReason, string> = {
  inaccurate: "Claim is inaccurate",
  "no-proof": "Proof does not support it",
  spam: "Spam or duplicate",
  abuse: "Abusive or off topic",
  other: "Something else",
};

export const MOD_ACTIONS = ["verify", "reject", "reset", "dismiss"] as const;
export type ModAction = (typeof MOD_ACTIONS)[number];

export const MOD_ACTION_LABELS: Record<ModAction, string> = {
  verify: "Verify",
  reject: "Reject",
  reset: "Reset to votes",
  dismiss: "Dismiss reports",
};

export interface FeatState {
  status: FeatStatus;
  staffLocked: boolean;
  upvotes: number;
  downvotes: number;
  proofsValid: boolean;
}

export interface ModOutcome {
  status: FeatStatus;
  staffLocked: boolean;
  touchesFeat: boolean;
  reportStatus: "resolved" | "dismissed";
}

export function needsNote(action: ModAction): boolean {
  return action === "verify" || action === "reject";
}

export function applyModAction(action: ModAction, state: FeatState): ModOutcome {
  switch (action) {
    case "verify":
      return { status: "verified", staffLocked: true, touchesFeat: true, reportStatus: "resolved" };
    case "reject":
      return { status: "rejected", staffLocked: true, touchesFeat: true, reportStatus: "resolved" };
    case "reset":
      return {
        status: decideFeatStatus({
          upvotes: state.upvotes,
          downvotes: state.downvotes,
          current: "pending",
          proofsValid: state.proofsValid,
          staffLocked: false,
        }),
        staffLocked: false,
        touchesFeat: true,
        reportStatus: "resolved",
      };
    case "dismiss":
      return { status: state.status, staffLocked: state.staffLocked, touchesFeat: false, reportStatus: "dismissed" };
  }
}

export function verificationChanged(before: FeatStatus, after: FeatStatus): boolean {
  return before !== after && (before === "verified" || after === "verified");
}