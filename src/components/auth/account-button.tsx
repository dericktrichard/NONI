"use client";

import Link from "next/link";
import { useSession } from "@/hooks/use-session";
import { OPEN_SIGN_IN } from "@/lib/auth/events";
import { OPEN_PROFILE_SETUP } from "@/lib/ui/events";

export function AccountButton() {
  const { state } = useSession();

  if (state.status === "loading") return <div className="h-10 w-20" aria-hidden />;

  const user = state.user;

  if (!user) {
    return (
      <button type="button" className="btn btn-line btn-sm" onClick={() => window.dispatchEvent(new Event(OPEN_SIGN_IN))}>
        Sign in
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {user.role !== "user" ? (
        <Link href="/admin" className="eyebrow px-2 py-3 hover:underline">
          Admin
        </Link>
      ) : null}

      {user.handle ? (
        <Link
          href={`/u/${user.handle}`}
          aria-label="Your profile"
          title={`@${user.handle}`}
          className="grid size-10 place-items-center border bg-muted font-display text-base font-semibold uppercase transition-colors hover:border-foreground"
        >
          {user.handle.slice(0, 1)}
        </Link>
      ) : (
        <button
          type="button"
          className="btn btn-line btn-sm"
          onClick={() => window.dispatchEvent(new Event(OPEN_PROFILE_SETUP))}
        >
          Set up profile
        </button>
      )}
    </div>
  );
}