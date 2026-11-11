"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useBattleApi } from "@/hooks/use-battle-api";
import { cn } from "@/lib/utils";

export function StandingToggle({
  initial,
  onChange,
}: {
  initial: boolean;
  onChange?: (on: boolean) => void;
}) {
  const router = useRouter();
  const [on, setOn] = useState(initial);
  const { busy, error, request } = useBattleApi();

  async function flip() {
    const data = await request<{ on: boolean }>("/api/standing", { on: !on });
    if (!data) return;
    setOn(data.on);
    onChange?.(data.on);
    router.refresh();
  }

  return (
    <div>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        disabled={busy}
        onClick={flip}
        className="flex w-full items-center gap-3 text-left disabled:opacity-60"
      >
        <span
          className={cn(
            "flex h-6 w-11 shrink-0 items-center border p-0.5 transition-colors",
            on ? "bg-foreground justify-end" : "justify-start",
          )}
        >
          <span className={cn("size-4", on ? "bg-accent" : "bg-foreground")} />
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-medium">
            Show me on leaderboards and fan lists
          </span>
          <span className="text-muted-foreground block text-xs">
            Your handle and avatar appear on public boards. Off by default.
          </span>
        </span>
      </button>
      {error ? (
        <p role="alert" className="mt-2 text-sm">
          {error}
        </p>
      ) : null}
    </div>
  );
}
