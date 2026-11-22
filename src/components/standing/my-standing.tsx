"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSession } from "@/hooks/use-session";
import { OPEN_SIGN_IN } from "@/lib/auth/events";
import type { Place, Standing } from "@/lib/standing/types";
import { OPEN_PROFILE_SETUP } from "@/lib/ui/events";

function Cell({ label, place, unit }: { label: string; place: Place; unit: string }) {
  return (
    <div className="px-4 py-2">
      <dt className="eyebrow">{label}</dt>
      <dd className="tabular font-display text-xl leading-tight font-semibold">
        {place.rank === null ? "--" : `#${place.rank}`}
      </dd>
      <p className="tabular text-muted-foreground text-[11px]">
        {place.value.toLocaleString("en-US")} {unit}
      </p>
    </div>
  );
}

/** A slim line about the signed-in visitor. The "show me on boards" switch lives in profile settings. */
export function MyStanding() {
  const { state } = useSession();
  const user = state.status === "ready" ? state.user : null;
  const signedIn = user !== null;
  const [data, setData] = useState<Standing | null>(null);

  useEffect(() => {
    if (!signedIn) return;
    let live = true;
    fetch("/api/standing/me", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((next: Standing | null) => live && setData(next))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [signedIn]);

  const strip = "flex flex-wrap items-center gap-3 border p-3";

  if (state.status === "loading")
    return <div className="h-14 w-full border sm:w-80" aria-hidden />;

  if (!user) {
    return (
      <div className={strip}>
        <p className="text-sm">Sign in to join the boards.</p>
        <button
          type="button"
          className="btn btn-solid btn-sm"
          onClick={() => window.dispatchEvent(new Event(OPEN_SIGN_IN))}
        >
          Sign in
        </button>
      </div>
    );
  }

  if (!user.handle) {
    return (
      <div className={strip}>
        <p className="text-sm">Choose a handle to appear on the boards.</p>
        <button
          type="button"
          className="btn btn-solid btn-sm"
          onClick={() => window.dispatchEvent(new Event(OPEN_PROFILE_SETUP))}
        >
          Set up profile
        </button>
      </div>
    );
  }

  if (!data) return <div className="h-14 w-full border sm:w-80" aria-hidden />;

  if (!data.boards) {
    return (
      <div className={strip}>
        <p className="text-sm">You are not on the boards.</p>
        <Link href={`/u/${user.handle}`} className="btn btn-line btn-sm">
          Your profile
        </Link>
      </div>
    );
  }

  return (
    <dl className="flex divide-x border">
      <Cell label="Glaze" place={data.glaze} unit="Glaze" />
      <Cell label="This week" place={data.week} unit="net" />
      <Cell label="Titles" place={data.champions} unit="won" />
    </dl>
  );
}
