"use client";

import { useEffect, useState } from "react";
import { StandingToggle } from "@/components/standing/standing-toggle";
import { useSession } from "@/hooks/use-session";
import { OPEN_SIGN_IN } from "@/lib/auth/events";
import type { Place, Standing } from "@/lib/standing/types";
import { OPEN_PROFILE_SETUP } from "@/lib/ui/events";

function Cell({ label, place, unit }: { label: string; place: Place; unit: string }) {
  return (
    <div className="bg-background p-3">
      <dt className="eyebrow">{label}</dt>
      <dd className="tabular mt-1 font-display text-xl font-semibold">{place.rank === null ? "--" : `#${place.rank}`}</dd>
      <p className="tabular text-xs text-muted-foreground">
        {place.value.toLocaleString("en-US")} {unit}
      </p>
    </div>
  );
}

export function MyStanding() {
  const { state } = useSession();
  const user = state.status === "ready" ? state.user : null;
  const signedIn = user !== null;
  const [data, setData] = useState<Standing | null>(null);
  const [version, setVersion] = useState(0);

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
  }, [signedIn, version]);

  const shell = "mt-8 border p-4";

  if (state.status === "loading") return <div className={`${shell} h-24`} aria-hidden />;

  if (!user) {
    return (
      <div className={`${shell} flex flex-wrap items-center justify-between gap-3`}>
        <p className="text-sm">Sign in to get on the boards and earn fan badges.</p>
        <button type="button" className="btn btn-solid btn-sm" onClick={() => window.dispatchEvent(new Event(OPEN_SIGN_IN))}>
          Sign in
        </button>
      </div>
    );
  }

  if (!user.handle) {
    return (
      <div className={`${shell} flex flex-wrap items-center justify-between gap-3`}>
        <p className="text-sm">Choose a handle to appear on the boards.</p>
        <button type="button" className="btn btn-solid btn-sm" onClick={() => window.dispatchEvent(new Event(OPEN_PROFILE_SETUP))}>
          Set up profile
        </button>
      </div>
    );
  }

  if (!data) return <div className={`${shell} h-24`} aria-hidden />;

  return (
    <div className={shell}>
      {data.boards ? (
        <dl className="mb-4 grid grid-cols-3 gap-px border bg-border">
          <Cell label="Glaze" place={data.glaze} unit="Glaze" />
          <Cell label="This week" place={data.week} unit="net" />
          <Cell label="Titles" place={data.champions} unit="won" />
        </dl>
      ) : (
        <p className="mb-4 text-sm">Turn this on to join the boards. Your rank appears here once you do.</p>
      )}
      <StandingToggle initial={data.boards} onChange={() => setVersion((v) => v + 1)} />
    </div>
  );
}