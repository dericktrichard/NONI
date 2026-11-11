"use client";

import { X } from "lucide-react";
import Link from "next/link";
import { dismiss, useDismissed } from "@/hooks/use-dismissed";
import { useSession } from "@/hooks/use-session";
import { OPEN_SIGN_IN } from "@/lib/auth/events";

const NAME = "guest-strip";

export function GuestStrip() {
  const { state } = useSession();
  const hidden = useDismissed(NAME);
  if (state.status !== "ready" || state.user !== null || hidden) return null;

  return (
    <aside
      aria-label="About NONI"
      className="relative mb-8 border p-4 pr-12 sm:p-5 sm:pr-14"
    >
      <p className="eyebrow flex items-center gap-2">
        <span className="bg-accent size-2" aria-hidden />
        New here
      </p>
      <p className="font-display mt-2 max-w-2xl text-lg font-semibold tracking-tight sm:text-xl">
        Fictional characters ranked from cited feats that the community verifies. Fixed
        rules, no opinions.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link href="/about" className="btn btn-line btn-sm">
          How it works
        </Link>
        <button
          type="button"
          className="btn btn-solid btn-sm"
          onClick={() => window.dispatchEvent(new Event(OPEN_SIGN_IN))}
        >
          Sign in
        </button>
      </div>
      <button
        type="button"
        aria-label="Dismiss"
        onClick={() => dismiss(NAME)}
        className="hover:bg-muted absolute top-0 right-0 grid size-11 place-items-center"
      >
        <X className="size-4" aria-hidden />
      </button>
    </aside>
  );
}
