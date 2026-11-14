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
  "flex h-[calc(100dvh-var(--nav-height)-var(--stage-gap,11rem))] min-h-144 flex-col lg:min-h-120 gap-3 lg:h-[calc(100dvh-var(--nav-height)-7.5rem)]";

interface SegmentedProps<T extends string | number> {
  label: string;
  value: T;
  options: ReadonlyArray<{ value: T; label: string; disabled?: boolean }>;
  onChange: (value: T) => void;
}

export function Segmented<T extends string | number>({
  label,
  value,
  options,
  onChange,
}: SegmentedProps<T>) {
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
              "enabled:hover:bg-muted h-8 border-b-2 border-transparent px-2.5 text-xs font-medium transition-colors disabled:opacity-40",
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
            index === phase
              ? "border-b-accent text-background"
              : "text-background/40 border-transparent",
          )}
        >
          {label}
        </li>
      ))}
    </ol>
  );
}

export const Tag = ({ children }: { children: React.ReactNode }) => (
  <span className="border-background/60 border px-1.5 py-0.5 text-[10px] font-semibold tracking-widest uppercase">
    {children}
  </span>
);

export function Sweep({ label }: { label: string }) {
  return (
    <div>
      <div
        className="border-background/50 relative h-1.5 overflow-hidden border"
        aria-hidden
      >
        <div className="anim-sweep bg-background absolute inset-y-0 left-0 w-2/5" />
      </div>
      <p className="text-background/60 mt-1 text-xs">{label}</p>
    </div>
  );
}

export function PlaybackBar({
  p,
  newLabel,
  onNew,
}: {
  p: Playback;
  newLabel: string;
  onNew: () => void;
}) {
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
            {p.running ? (
              <Pause className="size-4" aria-hidden />
            ) : (
              <Play className="size-4" aria-hidden />
            )}
            {p.running ? "Pause" : "Play"}
          </button>
          <button type="button" className="btn btn-line btn-sm" onClick={p.next}>
            Next
          </button>
          <button type="button" className="btn btn-quiet btn-sm" onClick={p.skip}>
            <SkipForward className="size-4" aria-hidden /> Skip
          </button>
          <button
            type="button"
            className="btn btn-quiet btn-sm tabular"
            onClick={p.cycleSpeed}
            aria-label="Playback speed"
          >
            {p.speed}x
          </button>
        </>
      )}
    </div>
  );
}

export function GlazeLine({
  settlement,
  stake,
  notice,
  moves = [],
}: {
  settlement: GlazeChange;
  stake: number;
  notice?: string | null;
  moves?: string[];
}) {
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
    <div className="mt-3">
      <p className="tabular text-sm">
        {text}
        {capped ? ", daily limit reached" : ""}. Balance {balance.toLocaleString("en-US")}
        .{notice ? " " + notice : ""}
      </p>
      {moves.length > 0 ? (
        <ul className="mt-2 space-y-1">
          {moves.map((line) => (
            <li key={line} className="flex items-start gap-2 text-sm font-medium">
              <span className="bg-accent mt-1.5 size-1.5 shrink-0" aria-hidden />
              {line}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

interface FighterProps {
  card: BattleCard;
  side: "l" | "r";
  phase: number;
  result: "win" | "loss" | "draw";
  health?: { from: number; to: number };
  /** Fixed, shorter card. Used by the tournament duel. */
  compact?: boolean;
}

/** One fighter on the dark stage. The verdict only shows on the last beat. */
export function Fighter({ card, side, phase, result, health, compact }: FighterProps) {
  const down = phase === 2 && result !== "win";
  const won = phase === 2 && result === "win";
  return (
    <div
      className={cn(
        "flex min-h-0 min-w-0 flex-1 flex-col",
        side === "l" ? "anim-in-l" : "anim-in-r",
      )}
    >
      <div
        className={cn(
          "border-background/40 relative border",
          compact ? "h-36 shrink-0 sm:h-44" : "min-h-16 flex-1",
          phase === 1 && (side === "l" ? "anim-clash-l" : "anim-clash-r"),
        )}
      >
        <Portrait
          name={card.name}
          src={card.imageUrl}
          sizes="240px"
          className={cn(
            "absolute inset-0 size-full transition-[filter] duration-700",
            down && "grayscale",
          )}
        />
        {down ? (
          <span className="anim-pop absolute inset-0 grid place-items-center">
            <span className="border-foreground bg-background font-display text-foreground -rotate-6 border-2 px-2 text-2xl font-bold sm:text-3xl">
              KO
            </span>
          </span>
        ) : null}
        {won ? (
          <span className="anim-pop bg-background text-foreground absolute top-1 left-1 flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-semibold tracking-widest uppercase">
            <span className="bg-accent size-1.5" aria-hidden /> Winner
          </span>
        ) : null}
      </div>
      <p className="font-display mt-1 truncate text-sm font-semibold sm:text-base">
        {card.name}
      </p>
      {health ? (
        <div className="border-background/50 mt-1 h-1.5 border">
          <div
            className="bg-background h-full transition-[width] duration-1000"
            style={{ width: `${phase === 2 ? health.to : health.from}%` }}
          />
        </div>
      ) : null}
    </div>
  );
}
