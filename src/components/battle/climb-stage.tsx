"use client";

import { useEffect, useState } from "react";
import {
  Fighter,
  GlazeLine,
  PhaseRail,
  PlaybackBar,
  STAGE,
  Segmented,
  Sweep,
  Tag,
} from "@/components/battle/shared";
import { PlayMode } from "@/components/battle/play-mode";
import { usePlayback } from "@/hooks/use-playback";
import type { ClimbResult } from "@/lib/battle/climb";
import { heroMatch, heroRounds, roundName } from "@/lib/battle/rounds";
import type { ClimbOutcome } from "@/lib/data/battles";
import { cn } from "@/lib/utils";

const label = "text-[10px] font-medium tracking-widest uppercase";

interface LadderProps {
  result: ClimbResult;
  step: number;
  resolved: number;
  done: boolean;
}

function Ladder({ result, step, resolved, done }: LadderProps) {
  const rounds = result.rounds.length;
  const champion = result.beatenBy === null;
  return (
    <ol className="flex gap-1.5" aria-label="Rounds">
      {Array.from({ length: rounds }, (_, index) => {
        const round = index + 1;
        const state =
          round <= resolved
            ? round <= result.wins
              ? "won"
              : "lost"
            : !done && round === step
              ? "now"
              : done
                ? "gone"
                : "pending";
        return (
          <li
            key={round}
            className={cn(
              "flex min-w-0 flex-1 flex-col border p-2 transition-colors duration-500",
              state === "won" && "bg-foreground text-background",
              state === "lost" && "border-foreground",
              state === "now" && "border-foreground ring-foreground ring-2",
              (state === "pending" || state === "gone") &&
                "text-muted-foreground opacity-60",
            )}
          >
            <span className={cn(label, "truncate")}>
              {roundName(round, rounds, true)}
            </span>
            <span
              className={cn("mt-1 text-xs font-medium", state === "now" && "anim-pulse")}
            >
              {state === "won"
                ? "Cleared"
                : state === "lost"
                  ? "Out"
                  : state === "now"
                    ? "Now"
                    : "-"}
            </span>
          </li>
        );
      })}
      <li
        className={cn(
          "flex min-w-0 flex-1 flex-col border p-2 transition-colors duration-500",
          done && champion
            ? "bg-foreground text-background"
            : "text-muted-foreground opacity-60",
        )}
      >
        <span className={cn(label, "flex items-center gap-1")}>
          {done && champion ? <span className="bg-accent size-1.5" aria-hidden /> : null}
          No. 1
        </span>
        <span className="mt-1 text-xs font-medium">
          {done && champion ? "Yours" : "-"}
        </span>
      </li>
    </ol>
  );
}

function Bracket({
  result,
  decided,
  current,
}: {
  result: ClimbResult;
  decided: number;
  current: number;
}) {
  const rounds = result.rounds.length;
  return (
    <div className="flex h-full min-w-136 gap-3">
      {result.rounds.map((matches, index) => {
        const round = index + 1;
        const known = round === 1 || decided >= round - 1;
        const over = decided >= round;
        return (
          <div key={round} className="flex min-w-0 flex-1 flex-col">
            <p className={cn(label, "text-muted-foreground mb-1 truncate")}>
              {roundName(round, rounds, true)}
            </p>
            <ul className="flex flex-1 flex-col justify-around gap-1.5">
              {matches.map((match, slot) => {
                const hero = match.a === result.hero || match.b === result.hero;
                return (
                  <li
                    key={`${match.a}-${match.b}`}
                    style={over ? { animationDelay: `${slot * 90}ms` } : undefined}
                    className={cn(
                      "border",
                      known && hero && "border-foreground",
                      hero && round === current && "anim-pulse ring-foreground ring-2",
                      over && "anim-pop",
                    )}
                  >
                    {[
                      { slug: match.a, name: match.aName },
                      { slug: match.b, name: match.bName },
                    ].map((side) => {
                      const won = over && match.winner === side.slug;
                      return (
                        <p
                          key={side.slug}
                          className={cn(
                            "truncate border-l-2 border-transparent px-2 py-1 text-xs",
                            known && side.slug === result.hero && "border-l-accent",
                            won && "font-semibold",
                            over && !won && "text-muted-foreground line-through",
                          )}
                        >
                          {known ? side.name : "-"}
                        </p>
                      );
                    })}
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

export function ClimbStage({
  outcome,
  onNew,
  onSettled,
}: {
  outcome: ClimbOutcome;
  onNew: () => void;
  onSettled: () => void;
}) {
  const { result, cards, settlement, notice } = outcome;
  const rounds = result.rounds.length;
  const played = heroRounds(result);
  const p = usePlayback(played);
  const finished = p.done;
  useEffect(() => {
    if (finished) onSettled();
  }, [finished, onSettled]);
  const [view, setView] = useState<"duel" | "bracket">("duel");

  const match = p.done ? undefined : heroMatch(result, p.step);
  const champion = result.beatenBy === null;
  const name = (slug: string) => cards[slug]?.name ?? slug;
  const opponent = match ? (match.a === result.hero ? match.b : match.a) : null;
  const heroWon = match?.winner === result.hero;
  const heroChance = match
    ? Math.round(
        (match.a === result.hero ? match.probabilityA : 1 - match.probabilityA) * 100,
      )
    : 50;
  const heroCard = cards[result.hero];
  const rivalCard = opponent ? cards[opponent] : undefined;
  const upsets = result.rounds
    .flat()
    .filter((m) => m.upset && (m.a === result.hero || m.b === result.hero)).length;

  return (
    <div className={STAGE}>
      <PlayMode active={!finished} />
      <Ladder result={result} step={p.step} resolved={p.resolved} done={p.done} />

      <div className="lg:hidden">
        <Segmented
          label="View"
          value={view}
          options={[
            { value: "duel", label: "Duel" },
            { value: "bracket", label: "Bracket" },
          ]}
          onChange={setView}
        />
      </div>

      <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[minmax(0,1fr)_26rem] lg:gap-6">
        <div
          className={cn(
            "min-h-0 overflow-auto",
            view === "duel" ? "hidden lg:block" : "block",
          )}
        >
          <Bracket
            result={result}
            decided={p.done ? rounds : p.resolved}
            current={p.done ? 0 : p.step}
          />
        </div>

        <section
          className={cn(
            "bg-foreground text-background min-h-0 flex-col overflow-hidden p-3 sm:p-4",
            view === "bracket" ? "hidden lg:flex" : "flex",
          )}
        >
          <div role="status" aria-live="polite" className="flex min-h-0 flex-1 flex-col">
            {p.done ? (
              <div className="anim-pop my-auto">
                <p className="text-background/60 text-[10px] font-medium tracking-widest uppercase">
                  {result.size} fighters
                </p>
                <p className="font-display mt-1 flex items-center gap-2 text-3xl font-semibold sm:text-5xl">
                  {champion ? <span className="bg-accent size-3" aria-hidden /> : null}
                  {champion ? "Champion" : `Out in the ${roundName(played, rounds)}`}
                </p>
                <p className="text-background/70 mt-2 text-sm">
                  {champion
                    ? `${name(result.hero)} beat all ${rounds} rounds and reached No. 1.`
                    : `Beaten by ${name(result.beatenBy!)}. ${name(result.champion)} took the title.`}
                  {upsets > 0
                    ? ` ${upsets} upset${upsets > 1 ? "s" : ""} on the way.`
                    : ""}
                </p>
                <GlazeLine
                  settlement={settlement}
                  stake={0}
                  notice={notice}
                  moves={outcome.moves}
                />
              </div>
            ) : match && heroCard && rivalCard ? (
              <div key={p.step} className="flex min-h-0 flex-1 flex-col">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-display text-lg font-semibold">
                    {roundName(p.step, rounds)}
                  </p>
                  <PhaseRail phase={p.phase} />
                </div>
                <div className="mt-3 flex min-h-0 flex-1 items-center gap-2 sm:gap-3">
                  <Fighter
                    compact
                    card={heroCard}
                    side="l"
                    phase={p.phase}
                    result={heroWon ? "win" : "loss"}
                  />
                  <span className="font-display grid place-items-center text-2xl font-bold sm:text-4xl">
                    VS
                  </span>
                  <Fighter
                    compact
                    card={rivalCard}
                    side="r"
                    phase={p.phase}
                    result={heroWon ? "loss" : "win"}
                  />
                </div>
                <div className="mt-3 min-h-14">
                  {p.phase === 0 ? (
                    <p className="text-background/80 text-sm">
                      {heroCard.name} meets {rivalCard.name}.
                    </p>
                  ) : p.phase === 1 ? (
                    <Sweep label="Trading blows..." />
                  ) : (
                    <>
                      <p className="flex items-center gap-2 text-sm font-medium">
                        {heroWon ? (
                          <span className="bg-accent size-2" aria-hidden />
                        ) : null}
                        {heroWon ? "Advances" : "Eliminated"}
                        <span className="text-background/70 font-normal">
                          {match.note}
                        </span>
                      </p>
                      <p className="text-background/70 mt-1.5 flex flex-wrap items-center gap-2 text-xs">
                        {match.upset ? <Tag>Upset</Tag> : null}
                        You had {heroChance}% going in.
                      </p>
                    </>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </section>
      </div>

      <PlaybackBar p={p} newLabel="New climb" onNew={onNew} />
    </div>
  );
}
