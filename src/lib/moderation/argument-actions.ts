export const ARGUMENT_ACTIONS = ["hide", "restore", "dismiss"] as const;
export type ArgumentAction = (typeof ARGUMENT_ACTIONS)[number];
export type ArgumentStatus = "visible" | "hidden";

export const ARGUMENT_ACTION_LABELS: Record<ArgumentAction, string> = {
  hide: "Hide",
  restore: "Restore",
  dismiss: "Dismiss reports",
};

export interface ArgumentOutcome {
  status: ArgumentStatus;
  touchesArgument: boolean;
  reportStatus: "resolved" | "dismissed";
}

export function argumentNeedsNote(action: ArgumentAction): boolean {
  return action === "hide";
}

export function actionsFor(status: ArgumentStatus): ArgumentAction[] {
  return status === "visible" ? ["hide", "dismiss"] : ["restore", "dismiss"];
}

export function applyArgumentAction(action: ArgumentAction, current: ArgumentStatus): ArgumentOutcome {
  switch (action) {
    case "hide":
      return { status: "hidden", touchesArgument: true, reportStatus: "resolved" };
    case "restore":
      return { status: "visible", touchesArgument: true, reportStatus: "resolved" };
    case "dismiss":
      return { status: current, touchesArgument: false, reportStatus: "dismissed" };
  }
}