"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { ProfileAvatar } from "@/components/profile/banner";
import { useGlaze } from "@/hooks/use-glaze";
import { OPEN_SIGN_IN } from "@/lib/auth/events";
import { BANK } from "@/lib/bank/rules";
import { postJson } from "@/lib/battle/client";
import type { BankInfo } from "@/lib/data/banks";
import { cn } from "@/lib/utils";

export function BankPanel({
  slug,
  name,
  bank,
}: {
  slug: string;
  name: string;
  bank: BankInfo;
}) {
  const [balance, setBalance] = useGlaze();
  const [total, setTotal] = useState(bank.total);
  const [amount, setAmount] = useState<number>(BANK.amounts[0]);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  /** Kept until a contribution succeeds, so retrying the same amount can never charge twice */
  const nonce = useRef<string | null>(null);

  function choose(value: number) {
    nonce.current = null;
    setAmount(value);
  }

  async function give() {
    nonce.current ??= crypto.randomUUID();
    setBusy(true);
    setNote(null);
    const reply = await postJson<{ balance: number; total: number }>(
      "/api/bank/contribute",
      {
        slug,
        amount,
        nonce: nonce.current,
      },
    );
    if (reply.ok) {
      nonce.current = null;
      setBalance(reply.data.balance);
      setTotal(reply.data.total);
      setNote(`${amount} Glaze added to the bank.`);
    } else {
      if (reply.status === 401) window.dispatchEvent(new Event(OPEN_SIGN_IN));
      setNote(reply.status === 401 ? "Sign in to contribute." : reply.error);
    }
    setBusy(false);
  }

  return (
    <section aria-label={`${name} bank`} className="mt-6 border">
      <div className="border-b px-3 py-2">
        <p className="eyebrow">Bank</p>
      </div>

      <div className="p-3">
        <p className="tabular font-display text-4xl leading-none font-semibold">
          {total.toLocaleString("en-US")}
        </p>
        <p className="eyebrow mt-1">
          {bank.rank ? `#${bank.rank} richest character` : "Glaze in the bank"}
          {bank.weekTotal > 0
            ? ` · ${bank.weekTotal.toLocaleString("en-US")} this week`
            : ""}
        </p>
      </div>

      {bank.contributors.length > 0 ? (
        <ol className="border-t">
          {bank.contributors.map((row) => (
            <li key={row.handle} className="border-b last:border-b-0">
              <Link
                href={`/u/${row.handle}`}
                className="hover:bg-muted grid grid-cols-[1.25rem_2rem_minmax(0,1fr)_auto] items-center gap-2.5 px-3 py-2 transition-colors"
              >
                <span className="tabular font-display flex items-center gap-1 text-base font-semibold">
                  {row.rank === 1 ? (
                    <span className="bg-accent size-1.5" aria-hidden />
                  ) : null}
                  {row.rank}
                </span>
                <ProfileAvatar
                  look={row.look}
                  handle={row.handle}
                  className="size-8 p-0.5"
                />
                <span className="min-w-0 truncate text-sm font-medium">
                  @{row.handle}
                </span>
                <span className="tabular text-sm">
                  {row.value.toLocaleString("en-US")}
                </span>
              </Link>
            </li>
          ))}
        </ol>
      ) : null}

      <div className="border-t p-3">
        <p className="eyebrow">Contribute</p>
        <div role="group" aria-label="Amount" className="mt-2 flex border-b">
          {BANK.amounts.map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={amount === value}
              disabled={balance !== null && value > balance}
              onClick={() => choose(value)}
              className={cn(
                "enabled:hover:bg-muted h-9 flex-1 border-b-2 border-transparent text-xs font-medium transition-colors disabled:opacity-40",
                amount === value && "border-b-accent",
              )}
            >
              {value}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="btn btn-solid btn-sm mt-3 w-full"
          disabled={busy}
          onClick={() => void give()}
        >
          {busy ? "Working..." : `Contribute ${amount} Glaze`}
        </button>
        {note ? (
          <p role="status" className="mt-2 text-sm font-medium">
            {note}
          </p>
        ) : null}
        <p className="text-muted-foreground mt-2 text-xs">
          Contributions are not refundable and never change rankings.
          {balance !== null ? ` You have ${balance.toLocaleString("en-US")} Glaze.` : ""}
        </p>
      </div>
    </section>
  );
}
