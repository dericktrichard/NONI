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
  if (day === null) return <div className="mt-6 h-96 border" aria-hidden />;

  const streak = liveDailyStreak(stats, day, previousDay(day));

  return (
    <div className="mt-4 sm:mt-6 [html[data-play=true]_&]:mt-0">
      <div
        data-chrome
        className="flex flex-wrap items-center justify-between gap-x-6 border-b"
      >
        <div role="group" aria-label="Game mode" className="flex">
          {(["daily", "endless"] as const).map((key) => (
            <button
              key={key}
              type="button"
              aria-pressed={mode === key}
              onClick={() => setMode(key)}
              className={cn(
                "hover:bg-muted h-10 border-b-2 border-transparent px-4 text-sm font-medium capitalize transition-colors",
                mode === key && "border-b-accent",
              )}
            >
              {key}
            </button>
          ))}
        </div>
        <dl className="flex items-baseline gap-5 py-2">
          <div className="flex items-baseline gap-2">
            <dt className="eyebrow">Daily streak</dt>
            <dd className="tabular font-display text-lg font-semibold">{streak}</dd>
          </div>
          <div className="flex items-baseline gap-2">
            <dt className="eyebrow">Best endless</dt>
            <dd className="tabular font-display text-lg font-semibold">
              {stats.bestStreak}
            </dd>
          </div>
        </dl>
      </div>

      <div className="mt-5 [html[data-play=true]_&]:mt-0">
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
