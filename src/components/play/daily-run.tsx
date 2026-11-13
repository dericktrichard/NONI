"use client";

import { useMemo, useState } from "react";
import { DuelView } from "@/components/play/duel-view";
import { ShareButton } from "@/components/share/share-button";
import { savePlayStats, usePlayStats } from "@/hooks/use-play-stats";
import {
  DAILY_ROUNDS,
  buildDaily,
  isCorrect,
  type Guess,
  type PlayCharacter,
} from "@/lib/play/game";
import { afterDaily, liveDailyStreak, previousDay } from "@/lib/play/stats";
import { cn } from "@/lib/utils";

function Squares({ answers, total }: { answers: boolean[]; total: number }) {
  return (
    <ol className="flex gap-1.5" aria-label="Answers">
      {Array.from({ length: total }, (_, index) => {
        const answer = answers[index];
        return (
          <li
            key={index}
            aria-label={
              answer === undefined ? "Not played" : answer ? "Correct" : "Wrong"
            }
            className={cn(
              "size-4 border",
              answer === true && "border-foreground bg-foreground",
              answer === false && "border-foreground",
              answer === undefined && "border-border bg-muted",
            )}
          />
        );
      })}
    </ol>
  );
}

function Result({
  day,
  answers,
  streak,
}: {
  day: string;
  answers: boolean[];
  streak: number;
}) {
  const score = answers.filter(Boolean).length;
  const text = `NONI Daily ${day}\n${score}/${answers.length}\n${answers.map((a) => (a ? "■" : "□")).join("")}`;

  return (
    <div className="border p-6 sm:p-10">
      <p className="eyebrow">Daily result / {day}</p>
      <p className="tabular font-display mt-3 text-6xl font-semibold">
        {score}
        <span className="text-muted-foreground"> / {answers.length}</span>
      </p>
      <div className="mt-5">
        <Squares answers={answers} total={answers.length} />
      </div>
      <p className="text-muted-foreground mt-5 text-sm">
        Daily streak: {streak}. A new puzzle starts at midnight UTC.
      </p>
      <div className="mt-6">
        <ShareButton title="NONI Daily" text={text} className="btn btn-solid" />
      </div>
    </div>
  );
}

export function DailyRun({ pool, day }: { pool: PlayCharacter[]; day: string }) {
  const stats = usePlayStats();
  const duels = useMemo(() => buildDaily(pool, day), [pool, day]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [guess, setGuess] = useState<Guess | null>(null);

  const yesterday = previousDay(day);

  if (stats.daily?.day === day) {
    return (
      <Result
        day={day}
        answers={stats.daily.answers}
        streak={liveDailyStreak(stats, day, yesterday)}
      />
    );
  }

  const duel = duels[index];
  if (!duel)
    return (
      <p className="text-muted-foreground border p-4 text-sm">
        Not enough characters for a puzzle yet.
      </p>
    );

  const last = answers[index];
  const last_ = guess === null ? null : (last ?? null);

  function pick(next: Guess) {
    if (guess !== null || !duel) return;
    setGuess(next);
    setAnswers((current) => [...current, isCorrect(duel, next)]);
  }

  function advance() {
    if (index + 1 < duels.length) {
      setIndex(index + 1);
      setGuess(null);
      return;
    }
    savePlayStats(afterDaily(stats, day, answers, yesterday));
  }

  return (
    <div>
      <div className="mb-5 flex items-center justify-between gap-4">
        <p className="eyebrow">
          Round {index + 1} of {Math.min(DAILY_ROUNDS, duels.length)}
        </p>
        <Squares answers={answers} total={duels.length} />
      </div>
      <DuelView
        duel={duel}
        guess={guess}
        correct={last_}
        onGuess={pick}
        action={
          guess !== null ? (
            <button type="button" className="btn btn-solid" onClick={advance}>
              {index + 1 < duels.length ? "Next round" : "See result"}
            </button>
          ) : null
        }
      />
    </div>
  );
}
