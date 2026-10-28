import { describe, expect, it } from "vitest";
import {
  ARGUMENT_ACTIONS,
  actionsFor,
  applyArgumentAction,
  argumentNeedsNote,
} from "@/lib/moderation/argument-actions";

describe("applyArgumentAction", () => {
  it("hide and restore change visibility and resolve the reports", () => {
    expect(applyArgumentAction("hide", "visible")).toEqual({
      status: "hidden",
      touchesArgument: true,
      reportStatus: "resolved",
    });
    expect(applyArgumentAction("restore", "hidden")).toEqual({
      status: "visible",
      touchesArgument: true,
      reportStatus: "resolved",
    });
  });

  it("dismiss keeps the status and only closes the reports", () => {
    expect(applyArgumentAction("dismiss", "hidden")).toEqual({
      status: "hidden",
      touchesArgument: false,
      reportStatus: "dismissed",
    });
  });
});

describe("actionsFor", () => {
  it("offers hide for visible arguments and restore for hidden ones", () => {
    expect(actionsFor("visible")).toEqual(["hide", "dismiss"]);
    expect(actionsFor("hidden")).toEqual(["restore", "dismiss"]);
  });

  it("only offers known actions", () => {
    for (const status of ["visible", "hidden"] as const) {
      for (const action of actionsFor(status)) expect(ARGUMENT_ACTIONS).toContain(action);
    }
  });
});

describe("argumentNeedsNote", () => {
  it("requires a reason to hide", () => {
    expect(argumentNeedsNote("hide")).toBe(true);
    expect(argumentNeedsNote("restore")).toBe(false);
    expect(argumentNeedsNote("dismiss")).toBe(false);
  });
});