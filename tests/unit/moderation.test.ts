import { describe, expect, it } from "vitest";
import {
  MOD_ACTIONS,
  applyModAction,
  needsNote,
  verificationChanged,
  type FeatState,
} from "@/lib/moderation/actions";

const state = (patch: Partial<FeatState> = {}): FeatState => ({
  status: "pending",
  staffLocked: false,
  upvotes: 0,
  downvotes: 0,
  proofsValid: true,
  ...patch,
});

describe("applyModAction", () => {
  it("verify and reject lock the decision and resolve the reports", () => {
    expect(applyModAction("verify", state())).toEqual({
      status: "verified",
      staffLocked: true,
      touchesFeat: true,
      reportStatus: "resolved",
    });
    expect(applyModAction("reject", state({ status: "verified" }))).toEqual({
      status: "rejected",
      staffLocked: true,
      touchesFeat: true,
      reportStatus: "resolved",
    });
  });

  it("reset unlocks and lets the votes decide again", () => {
    const strong = applyModAction("reset", state({ status: "rejected", staffLocked: true, upvotes: 9, downvotes: 1 }));
    expect(strong.status).toBe("verified");
    expect(strong.staffLocked).toBe(false);

    const weak = applyModAction("reset", state({ status: "verified", staffLocked: true, upvotes: 1, downvotes: 0 }));
    expect(weak.status).toBe("pending");
  });

  it("reset never verifies a feat whose proofs are invalid", () => {
    const outcome = applyModAction("reset", state({ upvotes: 20, downvotes: 0, proofsValid: false }));
    expect(outcome.status).toBe("pending");
  });

  it("dismiss leaves the feat alone and only closes the reports", () => {
    const outcome = applyModAction("dismiss", state({ status: "verified", staffLocked: true }));
    expect(outcome).toEqual({ status: "verified", staffLocked: true, touchesFeat: false, reportStatus: "dismissed" });
  });
});

describe("needsNote", () => {
  it("requires a reason only for decisions", () => {
    expect(MOD_ACTIONS.filter(needsNote)).toEqual(["verify", "reject"]);
  });
});

describe("verificationChanged", () => {
  it("is true only when a feat enters or leaves verified", () => {
    expect(verificationChanged("pending", "verified")).toBe(true);
    expect(verificationChanged("verified", "rejected")).toBe(true);
    expect(verificationChanged("verified", "verified")).toBe(false);
    expect(verificationChanged("pending", "rejected")).toBe(false);
  });
});