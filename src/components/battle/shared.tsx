"use client";

import { Pause, Play, RotateCcw, SkipForward } from "lucide-react";
import { Portrait } from "@/components/characters/portrait";
import type { usePlayback } from "@/hooks/use-playback";
import type { BattleCard } from "@/lib/battle/view";
import type { GlazeChange } from "@/lib/data/glaze";
import { cn } from "@/lib/utils";

type Playback = ReturnType<typeof usePlayback>;

/** Fills the screen below the nav so a whole screen of the game is visible without page scrolling */
export const STAGE =
  "flex h-[calc(100dvh-var(--nav-height)-11rem)] min-h-144 flex-col lg:min-h-120 gap-3 lg:h-[calc(100dvh-var(--nav-height)-7.5rem)]";

interface SegmentedProps<T extends string | number> {
  label: string;
  value: T;
  options: ReadonlyArray<{ value: T; label: string; disabled?: boolean }>;
  onChange: (value: T) => void;
}

export function Segmented<T extends string | number>({ label, value, options, onChange }: SegmentedProps<T>) {
  return (
    <div role="group" aria-label={label} className="flex items-center gap-2">
      <span className="eyebrow">{label}</span>
      <div className="flex border-b">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            disabled={option.disabled}
            aria-pressed={value === option.value}
            onClick={() => onChange(option.value)}
            className={cn(
              "h-8 border-b-2 border-transparent px-2.5 text-xs font-medium transition-colors enabled:hover:bg-muted disabled:opacity-40",
              value === option.value && "border-b-accent",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

const PHASES = ["Face off", "Clash", "Verdict"];

export function PhaseRail({ phase }: { phase: number }) {
  return (
    <ol className="flex gap-3" aria-hidden>
      {PHASES.map((label, index) => (
        <li
          key={label}
          className={cn(
            "border-b-2 pb-0.5 text-[10px] font-medium tracking-widest uppercase transition-colors",
            index === phase ? "border-b-accent text-background" : "border-transparent text-background/40",
          )}
        >
          {label}
        </li>
      ))}
    </ol>
  );
}

export const Tag = ({ children }: { children: React.ReactNode }) => (
  <span className="border border-background/60 px-1.5 py-0.5 text-[10px] font-semibold tracking-widest uppercase">{children}</span>
);

export function Sweep({ label }: { label: string }) {
  return (
    <div>
      <div className="relative h-1.5 overflow-hidden border border-background/50" aria-hidden>
        <div className="anim-sweep absolute inset-y-0 left-0 w-2/5 bg-background" />
      </div>
      <p className="mt-1 text-xs text-background/60">{label}</p>
    </div>
  );
}

export function PlaybackBar({ p, newLabel, onNew }: { p: Playback; newLabel: string; onNew: () => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {p.done ? (
        <>
          <button type="button" className="btn btn-line btn-sm" onClick={p.restart}>
            <RotateCcw className="size-4" aria-hidden /> Replay
          </button>
          <button type="button" className="btn btn-solid btn-sm" onClick={onNew}>
            {newLabel}
          </button>
        </>
      ) : (
        <>
          <button type="button" className="btn btn-line btn-sm" onClick={p.toggle}>
            {p.running ? <Pause className="size-4" aria-hidden /> : <Play className="size-4" aria-hidden />}
            {p.running ? "Pause" : "Play"}
          </button>
          <button type="button" className="btn btn-line btn-sm" onClick={p.next}>
            Next
          </button>
          <button type="button" className="btn btn-quiet btn-sm" onClick={p.skip}>
            <SkipForward className="size-4" aria-hidden /> Skip
          </button>
          <button type="button" className="btn btn-quiet btn-sm tabular" onClick={p.cycleSpeed} aria-label="Playback speed">
            {p.speed}x
          </button>
        </>
      )}
    </div>
  );
}

export function GlazeLine({ settlement, stake }: { settlement: GlazeChange; stake: number }) {
  const { change, balance, capped } = settlement;
  const text =
    stake > 0
      ? change > 0
        ? `Won ${change} Glaze`
        : change < 0
          ? `Lost ${-change} Glaze`
          : "Stake returned"
      : change > 0
        ? `+${change} Glaze`
        : "No Glaze this time";
  return (
    <p className="tabular mt-3 text-sm">
      {text}
      {capped ? ", daily limit reached" : ""}. Balance {balance.toLocaleString("en-US")}.
    </p>
  );
}

interface FighterProps {
  card: BattleCard;
  side: "l" | "r";
  phase: number;
  result: "win" | "loss" | "draw";
  health?: { from: number; to: number };
}

/** One fighter on the dark stage. The verdict only shows on the last beat. */
export function Fighter({ card, side, phase, result, health }: FighterProps) {
  const down = phase === 2 && result !== "win";
  const won = phase === 2 && result === "win";
  return (
    <div className={cn("flex min-h-0 min-w-0 flex-1 flex-col", side === "l" ? "anim-in-l" : "anim-in-r")}>
      <div className={cn("relative min-h-16 flex-1 border border-background/40", phase === 1 && (side === "l" ? "anim-clash-l" : "anim-clash-r"))}>
        <Portrait
          name={card.name}
          src={card.imageUrl}
          sizes="240px"
          className={cn("absolute inset-0 size-full transition-[filter] duration-700", down && "grayscale")}
        />
        {down ? (
          <span className="anim-pop absolute inset-0 grid place-items-center">
            <span className="-rotate-6 border-2 border-foreground bg-background px-2 font-display text-2xl font-bold text-foreground sm:text-3xl">KO</span>
          </span>
        ) : null}
        {won ? (
          <span className="anim-pop absolute top-1 left-1 flex items-center gap-1 bg-background px-1.5 py-0.5 text-[10px] font-semibold tracking-widest text-foreground uppercase">
            <span className="size-1.5 bg-accent" aria-hidden /> Winner
          </span>
        ) : null}
      </div>
      <p className="mt-1 truncate font-display text-sm font-semibold sm:text-base">{card.name}</p>
      {health ? (
        <div className="mt-1 h-1.5 border border-background/50">
          <div className="h-full bg-background transition-[width] duration-1000" style={{ width: `${phase === 2 ? health.to : health.from}%` }} />
        </div>
      ) : null}
    </div>
  );
}