"use client";

import { useState, useSyncExternalStore } from "react";
import { DailyRun } from "@/components/play/daily-run";
import { EndlessRun } from "@/components/play/endless-run";
import { usePlayStats } from "@/hooks/use-play-stats";
import { DAILY_ROUNDS, todayKey, type PlayCharacter } from "@/lib/play/game";
import { liveDailyStreak, previousDay } from "@/lib/play/stats";
import { cn } from "@/lib/utils";

const noSubscription = () => () => undefined;

type Mode = "daily" | "endless";

export function PlayGame({ pool }: { pool: PlayCharacter[] }) {
  const day = useSyncExternalStore(noSubscription, todayKey, () => null);
  const stats = usePlayStats();
  const [mode, setMode] = useState<Mode>("daily");

  if (pool.length < DAILY_ROUNDS + 1) {
    return (
      <p className="text-muted-foreground mt-8 border p-4 text-sm">
        The game opens once at least {DAILY_ROUNDS + 1} characters are ranked.
      </p>
    );
  }
  if (day === null) return <div className="mt-8 h-96 border" aria-hidden />;

  const streak = liveDailyStreak(stats, day, previousDay(day));

  return (
    <div className="mt-8 [html[data-play=true]_&]:mt-0">
      <dl data-chrome className="bg-border grid grid-cols-2 gap-px border">
        <div className="bg-background p-3 sm:p-4">
          <dt className="eyebrow">Daily streak</dt>
          <dd className="tabular font-display mt-1 text-xl font-semibold sm:text-3xl">
            {streak}
          </dd>
        </div>
        <div className="bg-background p-3 sm:p-4">
          <dt className="eyebrow">Best endless streak</dt>
          <dd className="tabular font-display mt-1 text-xl font-semibold sm:text-3xl">
            {stats.bestStreak}
          </dd>
        </div>
      </dl>

      <div data-chrome role="group" aria-label="Game mode" className="mt-8 flex border-b">
        {(["daily", "endless"] as const).map((key) => (
          <button
            key={key}
            type="button"
            aria-pressed={mode === key}
            onClick={() => setMode(key)}
            className={cn(
              "hover:bg-muted h-11 border-b-2 border-transparent px-5 text-sm font-medium capitalize transition-colors",
              mode === key && "border-b-accent",
            )}
          >
            {key}
          </button>
        ))}
      </div>

      <div className="mt-6">
        <div className={cn(mode !== "daily" && "hidden")}>
          <DailyRun pool={pool} day={day} />
        </div>
        <div className={cn(mode !== "endless" && "hidden")}>
          <EndlessRun pool={pool} />
        </div>
      </div>
    </div>
  );
}
