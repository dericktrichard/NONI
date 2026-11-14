"use client";

import { useState } from "react";
import { PlayMode } from "@/components/battle/play-mode";
import { DuelView } from "@/components/play/duel-view";
import { MenuToggle } from "@/components/play/menu-toggle";
import { savePlayStats, usePlayStats } from "@/hooks/use-play-stats";
import {
  firstDuel,
  isCorrect,
  pickRight,
  type Duel,
  type Guess,
  type PlayCharacter,
} from "@/lib/play/game";
import { afterEndless } from "@/lib/play/stats";

type State =
  | { phase: "idle" }
  | {
      phase: "playing";
      duel: Duel;
      streak: number;
      guess: Guess | null;
      correct: boolean | null;
    };

export function EndlessRun({ pool }: { pool: PlayCharacter[] }) {
  const stats = usePlayStats();
  const [state, setState] = useState<State>({ phase: "idle" });
  const [menu, setMenu] = useState(false);

  function start() {
    const duel = firstDuel(pool, Math.random);
    if (duel) setState({ phase: "playing", duel, streak: 0, guess: null, correct: null });
  }

  if (state.phase === "idle") {
    return (
      <div className="border p-6 sm:p-10">
        <p className="eyebrow">Endless</p>
        <p className="font-display mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
          How long can you last?
        </p>
        <p className="text-muted-foreground mt-3 max-w-md text-sm">
          Keep guessing until you miss. Your best streak: {stats.bestStreak}.
        </p>
        <button type="button" className="btn btn-solid mt-6" onClick={start}>
          Start
        </button>
      </div>
    );
  }

  const { duel, streak, guess, correct } = state;
  const over = guess !== null && !correct;

  function pick(next: Guess) {
    if (guess !== null) return;
    const right = isCorrect(duel, next);
    const newStreak = right ? streak + 1 : streak;
    savePlayStats(afterEndless(stats, newStreak));
    setState({ phase: "playing", duel, streak: newStreak, guess: next, correct: right });
  }

  function advance() {
    const nextRight = pickRight(pool, duel.right, Math.random);
    if (!nextRight) {
      start();
      return;
    }
    setState({
      phase: "playing",
      duel: { left: duel.right, right: nextRight },
      streak,
      guess: null,
      correct: null,
    });
  }

  return (
    <div>
      <PlayMode active={!over && !menu} />
      <div className="mb-5 flex items-center justify-between gap-4">
        <p className="eyebrow">Streak {streak}</p>
        <div className="flex items-center gap-3">
          <p className="eyebrow">Best {Math.max(stats.bestStreak, streak)}</p>
          <MenuToggle open={menu} onToggle={() => setMenu(!menu)} />
        </div>
      </div>
      <DuelView
        duel={duel}
        guess={guess}
        correct={correct}
        onGuess={pick}
        action={
          guess === null ? null : correct ? (
            <button type="button" className="btn btn-solid" onClick={advance}>
              Next
            </button>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <p className="font-display text-lg font-semibold">
                Game over. Streak: {streak}
              </p>
              <button type="button" className="btn btn-solid" onClick={start}>
                Play again
              </button>
            </div>
          )
        }
      />
    </div>
  );
}
