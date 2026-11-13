"use client";

import { OPEN_LISTS } from "@/lib/ui/events";

export function NewListButton() {
  return (
    <button
      type="button"
      className="btn btn-solid btn-sm"
      onClick={() => window.dispatchEvent(new Event(OPEN_LISTS))}
    >
      New list
    </button>
  );
}
