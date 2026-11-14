"use client";

import { useEffect, useRef, useState } from "react";
import { postJson } from "@/lib/battle/client";
import type { PlusState } from "@/lib/data/plus";
import { PLUS } from "@/lib/plus/rules";

const date = (ms: number) =>
  new Date(ms).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

export function PlusPanel() {
  const [plus, setPlus] = useState<PlusState | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  /** Kept until a purchase succeeds, so retrying can never charge twice */
  const nonce = useRef<string | null>(null);

  useEffect(() => {
    let live = true;
    void postJson<PlusState>("/api/plus", { op: "state" }).then((reply) => {
      if (live && reply.ok) setPlus(reply.data);
    });
    return () => {
      live = false;
    };
  }, []);

  async function showBanner() {
    nonce.current ??= crypto.randomUUID();
    setBusy(true);
    setNote(null);
    const reply = await postJson<PlusState>("/api/plus", {
      op: "banner",
      nonce: nonce.current,
    });
    if (reply.ok) {
      nonce.current = null;
      setPlus(reply.data);
      setNote("Done. Your banner shows on your home page.");
    } else {
      setNote(reply.error);
    }
    setBusy(false);
  }

  return (
    <section aria-label="NONI Plus" className="mt-4 border">
      <div className="border-b p-4">
        <p className="eyebrow">NONI Plus</p>
        <p className="font-display mt-1 text-xl font-semibold">
          {plus === null
            ? "Loading..."
            : plus.plus && plus.until
              ? `Active until ${date(plus.until)}`
              : "Not active"}
        </p>
      </div>

      <ul className="space-y-2 p-4 text-sm">
        <li className="flex items-start gap-2">
          <span className="bg-accent mt-1.5 size-1.5 shrink-0" aria-hidden />
          {PLUS.welcomeBought.toLocaleString("en-US")} Glaze added once when Plus first
          starts. It can be spent but never staked.
        </li>
        <li className="flex items-start gap-2">
          <span className="bg-accent mt-1.5 size-1.5 shrink-0" aria-hidden />
          Your profile banner as the hero on your own home page,{" "}
          {PLUS.homeBanner.price.toLocaleString("en-US")} Glaze for {PLUS.homeBanner.days}{" "}
          days. Only you see it.
        </li>
        <li className="flex items-start gap-2">
          <span className="bg-accent mt-1.5 size-1.5 shrink-0" aria-hidden />
          Higher daily limits: {PLUS.limits.practiceCap} practice Glaze,{" "}
          {PLUS.limits.stakesPerDay} stakes and {PLUS.limits.climbRuns} rewarded
          tournament runs a day. The daily winnings cap stays the same.
        </li>
      </ul>

      {plus && !plus.plus ? (
        <p className="text-muted-foreground border-t p-4 text-sm">
          Plus is not on sale yet.
        </p>
      ) : null}

      {plus?.plus ? (
        <div className="border-t p-4">
          <p className="text-sm">
            {plus.banner
              ? `Home banner active until ${date(plus.banner.until)}.`
              : "Home banner is off."}
          </p>
          <button
            type="button"
            className="btn btn-solid btn-sm mt-3"
            disabled={busy || plus.balance < PLUS.homeBanner.price}
            onClick={() => void showBanner()}
          >
            {busy
              ? "Working..."
              : `${plus.banner ? "Add" : "Show it for"} ${PLUS.homeBanner.days} days, ${PLUS.homeBanner.price.toLocaleString("en-US")} Glaze`}
          </button>
          <p className="text-muted-foreground mt-2 text-xs">
            Needs a profile banner image. It shows while Plus is active. You have{" "}
            {plus.balance.toLocaleString("en-US")} Glaze.
          </p>
          {note ? (
            <p role="status" className="mt-2 text-sm font-medium">
              {note}
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
