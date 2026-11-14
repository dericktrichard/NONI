"use client";

import { useEffect } from "react";
import { Portrait } from "@/components/characters/portrait";
import {
  Fighter,
  GlazeLine,
  PhaseRail,
  PlaybackBar,
  STAGE,
  Sweep,
  Tag,
} from "@/components/battle/shared";
import { PlayMode } from "@/components/battle/play-mode";
import { usePlayback } from "@/hooks/use-playback";
import { replayAt, type FighterState } from "@/lib/battle/replay";
import type { BattleCard } from "@/lib/battle/view";
import type { ClashOutcome } from "@/lib/data/battles";
import { cn } from "@/lib/utils";

const alive = (states: FighterState[]) =>
  states.filter((state) => state.status !== "fallen").length;

function Tile({
  card,
  state,
  focus,
}: {
  card: BattleCard;
  state: FighterState;
  focus: boolean;
}) {
  const fallen = state.status === "fallen";
  const fighting = state.status === "fighting";
  const health = Math.round(state.vitality * 100);
  return (
    <li
      className={cn(
        "relative flex min-w-0 flex-col border p-1 transition-[opacity,box-shadow] duration-500 lg:flex-row lg:items-center lg:gap-3 lg:p-2",
        fighting && "border-foreground bg-muted ring-foreground ring-2",
        !fighting && !fallen && focus && "opacity-50",
        fallen && "anim-shake opacity-30",
      )}
    >
      <Portrait
        name={card.name}
        src={card.imageUrl}
        sizes="64px"
        className={cn(
          "mx-auto size-10 transition-[filter] duration-500 sm:size-12 lg:mx-0 lg:size-14 lg:shrink-0",
          fallen && "grayscale",
        )}
      />
      <div className="mt-1 min-w-0 flex-1 lg:mt-0">
        <p
          className={cn(
            "truncate text-center text-[11px] font-medium lg:text-left lg:text-sm",
            fallen && "line-through",
          )}
        >
          {card.name}
        </p>
        <div className="mt-1 h-1 border">
          <div
            className="bg-foreground h-full transition-[width] duration-1000"
            style={{ width: `${health}%` }}
          />
        </div>
        <p className="tabular text-muted-foreground mt-1 hidden text-xs lg:block">
          {fallen ? "Fallen" : `${health}% health`}
        </p>
      </div>
      <span className="sr-only">{state.status}</span>
    </li>
  );
}

function Side({
  title,
  cards,
  states,
  focus,
}: {
  title: string;
  cards: BattleCard[];
  states: FighterState[];
  focus: boolean;
}) {
  return (
    <section aria-label={title} className="flex min-h-0 flex-col lg:justify-center">
      <p className="eyebrow mb-2">{title}</p>
      <ul className="grid auto-cols-fr grid-flow-col gap-1.5 lg:flex lg:flex-col lg:gap-2">
        {cards.map((card, index) => (
          <Tile key={card.slug} card={card} state={states[index]!} focus={focus} />
        ))}
      </ul>
    </section>
  );
}

function Scoreboard({ a, b }: { a: FighterState[]; b: FighterState[] }) {
  const power = (states: FighterState[]) =>
    states.reduce((sum, state) => sum + state.vitality, 0);
  const total = power(a) + power(b);
  const share = total === 0 ? 50 : Math.round((power(a) / total) * 100);
  return (
    <div
      className="grid grid-cols-[auto_1fr_auto] items-center gap-3 sm:gap-6"
      role="img"
      aria-label={`${alive(a)} standing against ${alive(b)}`}
    >
      <div>
        <p className="eyebrow">You</p>
        <p className="tabular font-display text-3xl leading-none font-semibold sm:text-5xl">
          {alive(a)}
        </p>
      </div>
      <div>
        <div className="flex h-2 border">
          <div
            className="bg-foreground transition-[width] duration-1000"
            style={{ width: `${share}%` }}
          />
        </div>
        <p className="eyebrow mt-1 text-center">Momentum</p>
      </div>
      <div className="text-right">
        <p className="eyebrow">Them</p>
        <p className="tabular font-display text-3xl leading-none font-semibold sm:text-5xl">
          {alive(b)}
        </p>
      </div>
    </div>
  );
}

export function Arena({
  outcome,
  onChange,
  onSettled,
}: {
  outcome: ClashOutcome;
  onChange: () => void;
  onSettled: () => void;
}) {
  const { result, teamA, teamB, settlement, stake, chance, notice, matchmade } = outcome;
  const fights = result.fights.length;
  const p = usePlayback(fights);
  const finished = p.done;
  useEffect(() => {
    if (finished) onSettled();
  }, [finished, onSettled]);
  const fight = p.done ? undefined : result.fights[p.step - 1];
  const cards = new Map([...teamA, ...teamB].map((card) => [card.slug, card]));

  const statesA = replayAt(
    teamA.map((c) => c.slug),
    result.fights,
    p.resolved,
    fight,
  );
  const statesB = replayAt(
    teamB.map((c) => c.slug),
    result.fights,
    p.resolved,
    fight,
  );
  const survivors = result.winner === "a" ? result.survivorsA : result.survivorsB;
  const headline =
    result.winner === "a"
      ? "Your team wins"
      : result.winner === "b"
        ? "Opponent wins"
        : "Draw";
  const upsets = result.fights.filter((f) => f.upset).length;
  const verdict = (side: "a" | "b") =>
    fight?.winner === null ? "draw" : fight?.winner === side ? "win" : "loss";

  return (
    <div className={STAGE}>
      <PlayMode active={!finished} />
      <Scoreboard a={statesA} b={statesB} />

      <div className="grid min-h-0 flex-1 grid-rows-[auto_minmax(11rem,1fr)_auto] gap-3 lg:grid-cols-[1fr_minmax(0,28rem)_1fr] lg:grid-rows-1 lg:gap-6">
        <Side
          title="Your team"
          cards={teamA}
          states={statesA}
          focus={fight !== undefined}
        />

        <section className="bg-foreground text-background flex min-h-0 flex-col overflow-hidden p-3 sm:p-4">
          <div role="status" aria-live="polite" className="flex min-h-0 flex-1 flex-col">
            {p.done ? (
              <div className="anim-pop my-auto">
                <p className="text-background/60 text-[10px] font-medium tracking-widest uppercase">
                  Final result
                </p>
                <p className="font-display mt-1 flex items-center gap-2 text-3xl font-semibold sm:text-5xl">
                  {result.winner === "draw" ? null : (
                    <span className="bg-accent size-3" aria-hidden />
                  )}
                  {headline}
                </p>
                <p className="text-background/70 mt-2 text-sm">
                  {survivors.length > 0
                    ? `${survivors.length} of ${teamA.length} survived: ${survivors.map((s) => `${s.name} ${Math.round(s.vitality * 100)}%`).join(", ")}.`
                    : "Nobody is left standing."}
                </p>
                <p className="text-background/70 mt-1 text-sm">
                  {upsets > 0 ? `${upsets} upset${upsets > 1 ? "s" : ""}. ` : ""}
                  Your team had a {Math.round(chance * 100)}% chance going in.
                </p>
                <GlazeLine
                  settlement={settlement}
                  stake={stake}
                  notice={notice}
                  moves={outcome.moves}
                />
              </div>
            ) : fight ? (
              <div key={p.step} className="flex min-h-0 flex-1 flex-col">
                <div className="flex items-center justify-between gap-2">
                  <p className="tabular font-display text-lg font-semibold">
                    Fight {p.step}
                    <span className="text-background/50"> / {fights}</span>
                  </p>
                  <PhaseRail phase={p.phase} />
                </div>
                <div className="mt-3 flex min-h-0 flex-1 items-stretch gap-2 sm:gap-3">
                  <Fighter
                    card={cards.get(fight.a)!}
                    side="l"
                    phase={p.phase}
                    result={verdict("a")}
                    health={{
                      from: Math.round(fight.vitalityBeforeA * 100),
                      to: Math.round(fight.vitalityAfterA * 100),
                    }}
                  />
                  <span className="font-display grid place-items-center text-2xl font-bold sm:text-4xl">
                    VS
                  </span>
                  <Fighter
                    card={cards.get(fight.b)!}
                    side="r"
                    phase={p.phase}
                    result={verdict("b")}
                    health={{
                      from: Math.round(fight.vitalityBeforeB * 100),
                      to: Math.round(fight.vitalityAfterB * 100),
                    }}
                  />
                </div>
                <div className="mt-3 min-h-14">
                  {p.phase === 0 ? (
                    <p className="text-background/80 text-sm">
                      {fight.aName} faces {fight.bName}.
                    </p>
                  ) : p.phase === 1 ? (
                    <Sweep label="Trading blows..." />
                  ) : (
                    <>
                      <p className="text-sm">{fight.note}</p>
                      <p className="text-background/70 mt-1.5 flex flex-wrap items-center gap-2 text-xs">
                        {fight.upset ? <Tag>Upset</Tag> : null}
                        {fight.winner === null
                          ? "Both fighters withdraw."
                          : `The winner had ${Math.round(fight.winnerChance * 100)}% going in.`}
                      </p>
                    </>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </section>

        <Side
          title={matchmade ? "Matchmaker's pick" : "Opponent"}
          cards={teamB}
          states={statesB}
          focus={fight !== undefined}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <PlaybackBar p={p} newLabel="Change teams" onNew={onChange} />
        <ol className="ml-auto flex gap-1" aria-label="Fight log">
          {result.fights.map((f, index) => (
            <li key={f.index}>
              <button
                type="button"
                aria-label={`Fight ${index + 1}`}
                aria-current={!p.done && p.step === index + 1}
                onClick={() => p.jump(index + 1)}
                className={cn(
                  "grid h-7 w-5 grid-rows-2 border transition-opacity",
                  !p.done && p.step === index + 1 && "border-foreground",
                  index + 1 > p.resolved && "opacity-40",
                )}
              >
                <span
                  className={cn(
                    index < p.resolved && f.winner === "a" && "bg-foreground",
                  )}
                />
                <span
                  className={cn(
                    index < p.resolved && f.winner === "b" && "bg-foreground",
                  )}
                />
              </button>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
