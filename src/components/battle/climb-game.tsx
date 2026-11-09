"use client";

import { useState } from "react";
import { ClimbStage } from "@/components/battle/climb-stage";
import { RosterPicker } from "@/components/battle/roster-picker";
import { SetupShell } from "@/components/battle/setup-shell";
import { Segmented } from "@/components/battle/shared";
import { Portrait } from "@/components/characters/portrait";
import { useBattleApi } from "@/hooks/use-battle-api";
import type { ClimbMode } from "@/lib/battle/climb";
import { CLIMB } from "@/lib/battle/config";
import type { Difficulty } from "@/lib/battle/types";
import type { BattleCard } from "@/lib/battle/view";
import type { ClimbOutcome } from "@/lib/data/battles";
import { GLAZE } from "@/lib/glaze/rules";

const SIZES = CLIMB.sizes.map((n) => ({ value: n as number, label: String(n) }));
const MODES: Array<{ value: ClimbMode; label: string }> = [
  { value: "counters", label: "Counters" },
  { value: "random", label: "Random" },
];
const STRENGTHS: Array<{ value: Difficulty; label: string }> = [
  { value: "fair", label: "Fair" },
  { value: "hard", label: "Hard" },
];

export function ClimbGame({ balance, onBalance }: { balance: number | null; onBalance: (balance: number) => void }) {
  const [hero, setHero] = useState<BattleCard | null>(null);
  const [size, setSize] = useState<number>(CLIMB.sizes[0]);
  const [mode, setMode] = useState<ClimbMode>("counters");
  const [difficulty, setDifficulty] = useState<Difficulty>("fair");
  const [stake, setStake] = useState(0);
  const [outcome, setOutcome] = useState<ClimbOutcome | null>(null);
  const { busy, error, request } = useBattleApi();
  const risk = balance !== null && stake <= balance ? stake : 0;

  async function randomHero() {
    const data = await request<{ team: BattleCard[] }>("/api/battle/team", { mode: "random", size: 1 });
    if (data?.team[0]) setHero(data.team[0]);
  }

  async function climb() {
    if (!hero) return;
    const data = await request<ClimbOutcome>("/api/battle/climb", { hero: hero.slug, size, mode, difficulty, stake: risk });
    if (!data) return;
    onBalance(data.settlement.balance);
    setOutcome(data);
  }

  if (outcome) return <ClimbStage outcome={outcome} onNew={() => setOutcome(null)} />;

  return (
    <SetupShell
      top={
        <>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            <Segmented label="Field" value={size} options={SIZES} onChange={setSize} />
            <Segmented label="Rivals" value={mode} options={MODES} onChange={setMode} />
            {mode === "counters" ? <Segmented label="Counters" value={difficulty} options={STRENGTHS} onChange={setDifficulty} /> : null}
            <Segmented
              label="Stake"
              value={risk}
              onChange={setStake}
              options={GLAZE.stakes.map((value) => ({
                value: value as number,
                label: value === 0 ? "Free" : String(value),
                disabled: value > 0 && (balance === null || value > balance),
              }))}
            />
          </div>
          <p className="hidden text-xs text-muted-foreground sm:block">
            Win {Math.log2(size)} rounds to reach No. 1. Every match can go either way. Leave early and a stake is lost, win the title and it pays well.
          </p>

          <section className="flex items-center gap-3 border p-2">
            {hero ? (
              <Portrait name={hero.name} src={hero.imageUrl} sizes="64px" className="aspect-square w-16 shrink-0" />
            ) : (
              <span className="grid aspect-square w-16 shrink-0 place-items-center border border-dashed text-xs text-muted-foreground">?</span>
            )}
            <div className="min-w-0 flex-1">
              <p className="eyebrow truncate">{hero ? hero.verse : "Your fighter"}</p>
              <p className="truncate font-display text-xl font-semibold">{hero ? hero.name : "Pick from the roster"}</p>
            </div>
            <button type="button" className="btn btn-line btn-sm" disabled={busy} onClick={randomHero}>
              Random
            </button>
          </section>

          {error ? (
            <p role="alert" className="border p-2 text-sm">
              {error}
            </p>
          ) : null}
        </>
      }
      picker={<RosterPicker label="Choose your fighter" taken={new Set(hero ? [hero.slug] : [])} onPick={setHero} />}
      action={
        <button type="button" className="btn btn-solid w-full" disabled={!hero || busy} onClick={climb}>
          {busy ? "Working..." : hero ? (risk > 0 ? `Begin the climb, stake ${risk}` : "Begin the climb") : "Choose your fighter"}
        </button>
      }
    />
  );
}