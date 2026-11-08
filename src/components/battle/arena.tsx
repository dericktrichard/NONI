"use client";

import { Pause, Play, RotateCcw, SkipForward } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Portrait } from "@/components/characters/portrait";
import { replayAt, type FighterState } from "@/lib/battle/replay";
import type { BattleCard } from "@/lib/battle/view";
import type { ClashOutcome } from "@/lib/data/battles";
import { cn } from "@/lib/utils";

const STEP_MS = 2200;

function Tile({ card, state }: { card: BattleCard; state: FighterState }) {
  const fallen = state.status === "fallen";
  const health = Math.round(state.vitality * 100);
  return (
    <li
      className={cn(
        "relative flex min-w-0 flex-col border p-1 transition-[opacity,border-color] duration-500 lg:flex-row lg:items-center lg:gap-3 lg:p-2",
        state.status === "fighting" && "border-foreground",
        fallen && "opacity-40",
      )}
    >
      <Portrait
        name={card.name}
        src={card.imageUrl}
        sizes="64px"
        className={cn("aspect-square w-full transition-[filter] duration-500 lg:size-14 lg:shrink-0", fallen && "grayscale")}
      />
      <div className="mt-1 min-w-0 flex-1 lg:mt-0">
        <p className={cn("truncate text-[11px] font-medium lg:text-sm", fallen && "line-through")}>{card.name}</p>
        <div className="mt-1 h-1 border">
          <div className="h-full bg-foreground transition-[width] duration-700" style={{ width: `${health}%` }} />
        </div>
        <p className="tabular mt-1 hidden text-xs text-muted-foreground lg:block">{fallen ? "Fallen" : `${health}% health`}</p>
      </div>
      <span className="sr-only">{state.status}</span>
      {state.status === "fighting" ? <span className="absolute top-1.5 left-1.5 size-2 bg-foreground" aria-hidden /> : null}
    </li>
  );
}

function Side({ title, cards, states }: { title: string; cards: BattleCard[]; states: FighterState[] }) {
  const standing = states.filter((state) => state.status !== "fallen").length;
  return (
    <section aria-label={title} className="flex min-h-0 flex-col lg:justify-center">
      <p className="eyebrow mb-1 flex justify-between">
        <span>{title}</span>
        <span className="tabular">
          {standing} of {cards.length}
        </span>
      </p>
      <ul className="grid auto-cols-fr grid-flow-col gap-1.5 lg:flex lg:flex-col lg:gap-2">
        {cards.map((card, index) => (
          <Tile key={card.slug} card={card} state={states[index]!} />
        ))}
      </ul>
    </section>
  );
}

export function Arena({ outcome, onChange }: { outcome: ClashOutcome; onChange: () => void }) {
  const { result, teamA, teamB, reward } = outcome;
  const total = result.fights.length;
  const stage = useRef<HTMLDivElement>(null);
  const [reduced] = useState(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const [shown, setShown] = useState(reduced ? 0 : 1);
  const [playing, setPlaying] = useState(!reduced);
  const running = playing && shown < total;

  useEffect(() => {
    stage.current?.scrollIntoView({ block: "start", behavior: reduced ? "auto" : "smooth" });
  }, [reduced]);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setShown((n) => Math.min(total, n + 1)), STEP_MS);
    return () => clearInterval(id);
  }, [running, total]);

  const done = shown >= total;
  const fight = shown > 0 ? result.fights[shown - 1] : undefined;
  const statesA = replayAt(teamA.map((c) => c.slug), result.fights, shown);
  const statesB = replayAt(teamB.map((c) => c.slug), result.fights, shown);
  const share = fight ? Math.round(fight.effectiveProbabilityA * 100) : 50;

  const survivors = result.winner === "a" ? result.survivorsA : result.survivorsB;
  const headline = result.winner === "a" ? "Your team wins" : result.winner === "b" ? "Opponent wins" : "Draw";

  const replay = () => {
    setShown(reduced ? 0 : 1);
    setPlaying(!reduced);
  };

  return (
    <div
      ref={stage}
      className="grid h-[calc(100dvh-var(--nav-height)-7rem)] min-h-96 scroll-mt-[calc(var(--nav-height)+1.5rem)] grid-rows-[auto_minmax(0,1fr)_auto] gap-3 lg:h-[calc(100dvh-var(--nav-height)-3rem)] lg:grid-cols-[1fr_minmax(0,22rem)_1fr] lg:grid-rows-1 lg:gap-6"
    >
      <Side title="Your team" cards={teamA} states={statesA} />

      <section className="flex min-h-0 flex-col border p-3 sm:p-4">
        <div role="status" aria-live="polite" className="flex min-h-0 flex-1 overflow-y-auto">
          <div className="my-auto w-full">
            {done ? (
              <>
                <p className="flex items-center gap-2 font-display text-2xl font-semibold">
                  {result.winner === "draw" ? null : <span className="size-2.5 bg-accent" aria-hidden />}
                  {headline}
                </p>
                {survivors.length > 0 ? (
                  <>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {survivors.length} of {teamA.length} survived
                    </p>
                    <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                      {survivors.map((s) => (
                        <li key={s.slug}>
                          {s.name} <span className="tabular text-muted-foreground">{Math.round(s.vitality * 100)}%</span>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <p className="mt-1 text-sm text-muted-foreground">Nobody is left standing.</p>
                )}
                <p className="tabular mt-3 text-sm">
                  {reward.granted > 0 ? `+${reward.granted} Glaze` : "No Glaze this time"}
                  {reward.capped ? ", daily limit reached" : ""}. Balance {reward.balance.toLocaleString("en-US")}.
                </p>
              </>
            ) : fight ? (
              <>
                <p className="eyebrow">
                  Fight {shown} of {total}
                </p>
                <p className="mt-1 font-display text-lg font-semibold sm:text-xl">
                  {fight.aName} <span className="text-muted-foreground">vs</span> {fight.bName}
                </p>
                <div className="mt-3 flex h-1.5 border" aria-hidden>
                  <div className="bg-foreground transition-[width] duration-700" style={{ width: `${share}%` }} />
                </div>
                <p className="tabular mt-1 flex justify-between text-xs text-muted-foreground">
                  <span>{share}%</span>
                  <span>{100 - share}%</span>
                </p>
                <p className="mt-2 text-sm">{fight.note}</p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Press play to start the battle.</p>
            )}
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {done ? (
            <>
              <button type="button" className="btn btn-line btn-sm" onClick={replay}>
                <RotateCcw className="size-4" aria-hidden /> Replay
              </button>
              <button type="button" className="btn btn-solid btn-sm" onClick={onChange}>
                Change teams
              </button>
            </>
          ) : (
            <>
              <button type="button" className="btn btn-line btn-sm" onClick={() => setPlaying((p) => !p)}>
                {running ? <Pause className="size-4" aria-hidden /> : <Play className="size-4" aria-hidden />}
                {running ? "Pause" : "Play"}
              </button>
              <button type="button" className="btn btn-line btn-sm" onClick={() => setShown((n) => Math.min(total, n + 1))}>
                Next
              </button>
              <button type="button" className="btn btn-quiet btn-sm" onClick={() => setShown(total)}>
                <SkipForward className="size-4" aria-hidden /> Skip
              </button>
            </>
          )}
        </div>
      </section>

      <Side title="Opponent" cards={teamB} states={statesB} />
    </div>
  );
}