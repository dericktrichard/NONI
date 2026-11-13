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
    <div className="border">
      <Portrait
        name={c.name}
        src={c.imageUrl}
        sizes="(min-width: 640px) 360px, 50vw"
        className="aspect-4/5 w-full"
      />
      <div className="p-3 sm:p-4">
        <p className="eyebrow truncate">{c.verse}</p>
        <p className="font-display truncate text-lg font-semibold sm:text-2xl">
          {c.name}
        </p>
        <div className="mt-2 h-6">{open ? <TierBadge tier={c.tier} /> : null}</div>
        <p className="eyebrow mt-3">Score</p>
        <p className="tabular font-display text-3xl font-semibold sm:text-5xl">
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
  );
}

interface DuelViewProps {
  duel: Duel;
  guess: Guess | null;
  correct: boolean | null;
  onGuess: (guess: Guess) => void;
  action: React.ReactNode;
}

export function DuelView({ duel, guess, correct, onGuess, action }: DuelViewProps) {
  const revealed = guess !== null;
  const { left, right } = duel;
  const relation = right.score > left.score ? "higher than" : "lower than";

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <DuelCard c={left} known="always" />
        <DuelCard key={right.id} c={right} known={revealed} />
      </div>

      <p className="mt-5 text-center text-sm sm:text-base">
        Does <strong>{right.name}</strong> score higher or lower than{" "}
        <strong>{left.name}</strong>?
      </p>

      {revealed ? (
        <div role="status" className="mt-4 border p-4 text-center">
          <p className="font-display flex items-center justify-center gap-2 text-xl font-semibold">
            {correct ? <span className="bg-accent size-2.5" aria-hidden /> : null}
            {correct ? "Correct" : "Wrong"}
          </p>
          <p className="text-muted-foreground mt-1 text-sm">
            {right.name} scores {right.score.toLocaleString("en-US")}, {relation}{" "}
            {left.name}.
          </p>
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-3">
          <button
            type="button"
            className="btn btn-solid"
            onClick={() => onGuess("higher")}
          >
            Higher
          </button>
          <button type="button" className="btn btn-line" onClick={() => onGuess("lower")}>
            Lower
          </button>
        </div>
      )}

      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}
