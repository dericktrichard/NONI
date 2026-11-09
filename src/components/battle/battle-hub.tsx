"use client";

import { useState } from "react";
import { ClashGame } from "@/components/battle/clash-game";
import { ClimbGame } from "@/components/battle/climb-game";
import { useGlaze } from "@/hooks/use-glaze";
import { cn } from "@/lib/utils";

const TABS = [
  { key: "clash", label: "Team battle" },
  { key: "climb", label: "Tournament" },
] as const;

export function BattleHub() {
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("clash");
  const [balance, setBalance] = useGlaze();

  return (
    <div>
      <div className="flex items-end justify-between gap-4 border-b">
        <div role="group" aria-label="Game mode" className="flex">
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              aria-pressed={tab === key}
              onClick={() => setTab(key)}
              className={cn(
                "h-11 border-b-2 border-transparent px-4 text-sm font-medium transition-colors hover:bg-muted sm:px-5",
                tab === key && "border-b-accent",
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="pb-2.5 text-right">
          <span className="eyebrow mr-2">Glaze</span>
          <span className="tabular font-display text-xl font-semibold">{balance === null ? "-" : balance.toLocaleString("en-US")}</span>
        </p>
      </div>

      <div className="mt-3">
        <div className={cn(tab !== "clash" && "hidden")}>
          <ClashGame balance={balance} onBalance={setBalance} />
        </div>
        <div className={cn(tab !== "climb" && "hidden")}>
          <ClimbGame balance={balance} onBalance={setBalance} />
        </div>
      </div>
    </div>
  );
}