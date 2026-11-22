"use client";

import { useEffect, useState } from "react";
import { Portrait } from "@/components/characters/portrait";
import { TierBadge } from "@/components/characters/tier-badge";
import type { Duel, Guess, PlayCharacter } from "@/lib/play/game";

function CountUp({ to }: { to: number }) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const duration = reduce ? 0 : 700;
    let frame = 0;
    let start: number | null = null;

    const tick = (now: number) => {
      start ??= now;
      const t = duration === 0 ? 1 : Math.min(1, (now - start) / duration);
      setValue(Math.round(to * (1 - (1 - t) ** 3)));
      if (t < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [to]);

  return <>{value.toLocaleString("en-US")}</>;
}

function DuelCard({ c, known }: { c: PlayCharacter; known: "always" | boolean }) {
  const open = known === "always" || known;
  return (
    <div className="min-w-0 border">
      <Portrait
        name={c.name}
        src={c.imageUrl}
        sizes="(min-width: 1024px) 420px, 50vw"
        className="h-[clamp(9rem,28svh,30rem)] w-full lg:h-[clamp(14rem,46svh,32rem)]"
      />
      <div className="p-3 sm:p-4">
        <p className="eyebrow truncate">{c.verse}</p>
        <p className="font-display truncate text-base font-semibold sm:text-2xl">
          {c.name}
        </p>
        <div className="mt-2 flex items-end justify-between gap-2">
          <div className="h-6">{open ? <TierBadge tier={c.tier} /> : null}</div>
          <p className="tabular font-display text-2xl leading-none font-semibold sm:text-4xl">
            {known === "always" ? (
              c.score.toLocaleString("en-US")
            ) : known ? (
              <CountUp to={c.score} />
            ) : (
              "?"
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

interface DuelViewProps {
  duel: Duel;
  guess: Guess | null;
  correct: boolean | null;
  onGuess: (guess: Guess) => void;
  action: React.ReactNode;
  /** Round or streak line. Sits above the cards on a phone and in the side column on a desktop. */
  header?: React.ReactNode;
}

export function DuelView({
  duel,
  guess,
  correct,
  onGuess,
  action,
  header,
}: DuelViewProps) {
  const revealed = guess !== null;
  const { left, right } = duel;
  const relation = right.score > left.score ? "higher than" : "lower than";

  return (
    <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_17rem] lg:grid-rows-[auto_1fr] lg:gap-x-8">
      <div className="lg:col-start-2 lg:row-start-1">{header}</div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:col-start-1 lg:row-span-2 lg:row-start-1">
        <DuelCard c={left} known="always" />
        <DuelCard key={right.id} c={right} known={revealed} />
      </div>

      <div className="contents lg:col-start-2 lg:row-start-2 lg:block">
        <p className="mt-4 text-center text-sm sm:text-base lg:mt-0 lg:text-left">
          Does <strong>{right.name}</strong> score higher or lower than{" "}
          <strong>{left.name}</strong>?
        </p>

        <div className="bg-background/95 sticky bottom-(--sticky-bottom) z-30 -mx-4 mt-4 border-t px-4 pt-3 pb-2 backdrop-blur-sm sm:static sm:mx-0 sm:border-t-0 sm:p-0 sm:backdrop-blur-none">
          {revealed ? (
            <div role="status" className="border p-3 text-center sm:p-4 lg:text-left">
              <p className="font-display flex items-center justify-center gap-2 text-xl font-semibold lg:justify-start">
                {correct ? <span className="bg-accent size-2.5" aria-hidden /> : null}
                {correct ? "Correct" : "Wrong"}
              </p>
              <p className="text-muted-foreground mt-1 text-sm">
                {right.name} scores {right.score.toLocaleString("en-US")}, {relation}{" "}
                {left.name}.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                className="btn btn-solid"
                onClick={() => onGuess("higher")}
              >
                Higher
              </button>
              <button
                type="button"
                className="btn btn-line"
                onClick={() => onGuess("lower")}
              >
                Lower
              </button>
            </div>
          )}

          {action ? (
            <div className="mt-3 flex justify-center lg:justify-start">{action}</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
