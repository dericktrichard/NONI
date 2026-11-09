"use client";

import { useState } from "react";
import { Arena } from "@/components/battle/arena";
import { RosterPicker } from "@/components/battle/roster-picker";
import { SetupShell } from "@/components/battle/setup-shell";
import { Segmented } from "@/components/battle/shared";
import { TeamRow } from "@/components/battle/team-row";
import { useBattleApi } from "@/hooks/use-battle-api";
import { BATTLE } from "@/lib/battle/config";
import type { Difficulty } from "@/lib/battle/types";
import type { BattleCard } from "@/lib/battle/view";
import type { ClashOutcome } from "@/lib/data/battles";
import { GLAZE } from "@/lib/glaze/rules";

type Side = "a" | "b";

const SIZES = BATTLE.teamSizes.map((n) => ({ value: n as number, label: `${n}v${n}` }));
const STRENGTHS: Array<{ value: Difficulty; label: string }> = [
  { value: "fair", label: "Fair" },
  { value: "hard", label: "Hard" },
];

export function ClashGame({ balance, onBalance }: { balance: number | null; onBalance: (balance: number) => void }) {
  const [size, setSize] = useState<number>(BATTLE.teamSizes[0]);
  const [teams, setTeams] = useState<Record<Side, BattleCard[]>>({ a: [], b: [] });
  const [target, setTarget] = useState<Side>("a");
  const [difficulty, setDifficulty] = useState<Difficulty>("fair");
  const [stake, setStake] = useState(0);
  const [outcome, setOutcome] = useState<ClashOutcome | null>(null);
  const { busy, error, request } = useBattleApi();

  const other = (side: Side): Side => (side === "a" ? "b" : "a");
  const taken = new Set([...teams.a, ...teams.b].map((card) => card.slug));
  const ready = teams.a.length === size && teams.b.length === size;
  const risk = balance !== null && stake <= balance ? stake : 0;

  function changeSize(next: number) {
    setSize(next);
    setTeams((current) => ({ a: current.a.slice(0, next), b: current.b.slice(0, next) }));
  }

  function add(card: BattleCard) {
    const filled = [...teams[target], card];
    setTeams({ ...teams, [target]: filled });
    if (filled.length === size && teams[other(target)].length < size) setTarget(other(target));
  }

  const remove = (side: Side, slug: string) =>
    setTeams((current) => ({ ...current, [side]: current[side].filter((card) => card.slug !== slug) }));

  async function give(side: Side, mode: "random" | "counter") {
    const rival = teams[other(side)].map((card) => card.slug);
    const data = await request<{ team: BattleCard[] }>("/api/battle/team", {
      mode,
      size,
      difficulty,
      against: mode === "counter" ? rival : [],
      exclude: rival,
    });
    if (data) setTeams((current) => ({ ...current, [side]: data.team }));
  }

  async function fight() {
    const data = await request<ClashOutcome>("/api/battle/clash", {
      teamA: teams.a.map((card) => card.slug),
      teamB: teams.b.map((card) => card.slug),
      stake: risk,
    });
    if (!data) return;
    onBalance(data.settlement.balance);
    setOutcome(data);
  }

  if (outcome) return <Arena outcome={outcome} onChange={() => setOutcome(null)} />;

  const actions = (side: Side) => (
    <>
      <button type="button" className="btn btn-line btn-sm" disabled={busy} onClick={() => give(side, "random")}>
        Random
      </button>
      <button
        type="button"
        className="btn btn-line btn-sm"
        disabled={busy || teams[other(side)].length === 0}
        onClick={() => give(side, "counter")}
      >
        Counter
      </button>
    </>
  );

  const row = (side: Side, title: string) => (
    <TeamRow
      title={title}
      size={size}
      team={teams[side]}
      active={target === side}
      onActivate={() => setTarget(side)}
      onRemove={(slug) => remove(side, slug)}
      actions={actions(side)}
    />
  );

  return (
    <SetupShell
      top={
        <>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            <Segmented label="Size" value={size} options={SIZES} onChange={changeSize} />
            <Segmented label="Counters" value={difficulty} options={STRENGTHS} onChange={setDifficulty} />
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
            Fighters meet in slot order and the winner stays on, wounded. Beat the odds to win more. Lose a stake and it is gone.
          </p>
          {row("a", "Your team")}
          {row("b", "Opponent")}
          {error ? (
            <p role="alert" className="border p-2 text-sm">
              {error}
            </p>
          ) : null}
        </>
      }
      picker={
        <RosterPicker
          label={target === "a" ? "Adding to your team" : "Adding to the opponent"}
          taken={taken}
          onPick={(card) => teams[target].length < size && add(card)}
        />
      }
      action={
        <button type="button" className="btn btn-solid w-full" disabled={!ready || busy} onClick={fight}>
          {busy ? "Working..." : ready ? (risk > 0 ? `Start the battle, stake ${risk}` : "Start the battle") : `Fill both teams (${teams.a.length + teams.b.length} of ${size * 2})`}
        </button>
      }
    />
  );
}