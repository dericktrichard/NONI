"use client";

import { useState } from "react";
import { Arena } from "@/components/battle/arena";
import { RosterPicker } from "@/components/battle/roster-picker";
import { SetupShell } from "@/components/battle/setup-shell";
import { Segmented } from "@/components/battle/shared";
import { TeamRow } from "@/components/battle/team-row";
import { useBattleApi } from "@/hooks/use-battle-api";
import { BATTLE } from "@/lib/battle/config";
import { FAIR, type Today } from "@/lib/battle/fair-play";
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

interface ClashGameProps {
  balance: number | null;
  today: Today | null;
  onSettled: (balance: number, today: Today) => void;
}

export function ClashGame({ balance, today, onSettled }: ClashGameProps) {
  const [size, setSize] = useState<number>(BATTLE.teamSizes[0]);
  const [teams, setTeams] = useState<Record<Side, BattleCard[]>>({ a: [], b: [] });
  const [target, setTarget] = useState<Side>("a");
  const [difficulty, setDifficulty] = useState<Difficulty>("fair");
  const [stake, setStake] = useState(0);
  const [outcome, setOutcome] = useState<ClashOutcome | null>(null);
  const [pending, setPending] = useState<{ balance: number; today: Today } | null>(null);
  const { busy, error, request } = useBattleApi();

  const matchmade = today?.matchmade ?? false;
  const stakesLeft = today?.stakesLeft ?? FAIR.staked.perDay;
  const side: Side = matchmade ? "a" : target;
  const other = (s: Side): Side => (s === "a" ? "b" : "a");
  const taken = new Set(
    [...teams.a, ...(matchmade ? [] : teams.b)].map((card) => card.slug),
  );
  const ready = teams.a.length === size && (matchmade || teams.b.length === size);
  const risk =
    balance !== null && stake <= balance && (stake === 0 || stakesLeft > 0) ? stake : 0;

  /** The balance and limits only change on screen once the result has been shown */
  function settle() {
    if (!pending) return;
    onSettled(pending.balance, pending.today);
    setPending(null);
  }

  function changeSize(next: number) {
    setSize(next);
    setTeams((current) => ({ a: current.a.slice(0, next), b: current.b.slice(0, next) }));
  }

  function add(card: BattleCard) {
    const filled = [...teams[side], card];
    setTeams({ ...teams, [side]: filled });
    if (!matchmade && filled.length === size && teams[other(side)].length < size)
      setTarget(other(side));
  }

  const remove = (which: Side, slug: string) =>
    setTeams((current) => ({
      ...current,
      [which]: current[which].filter((card) => card.slug !== slug),
    }));

  async function give(which: Side, mode: "random" | "counter") {
    const rival = teams[other(which)].map((card) => card.slug);
    const data = await request<{ team: BattleCard[] }>("/api/battle/team", {
      mode,
      size,
      difficulty,
      against: mode === "counter" ? rival : [],
      exclude: rival,
    });
    if (data) setTeams((current) => ({ ...current, [which]: data.team }));
  }

  async function fight() {
    const data = await request<ClashOutcome>("/api/battle/clash", {
      teamA: teams.a.map((card) => card.slug),
      teamB: matchmade ? [] : teams.b.map((card) => card.slug),
      difficulty,
      stake: risk,
    });
    if (!data) return;
    setPending({ balance: data.settlement.balance, today: data.today });
    setOutcome(data);
  }

  if (outcome)
    return (
      <Arena
        outcome={outcome}
        onSettled={settle}
        onChange={() => {
          settle();
          setOutcome(null);
        }}
      />
    );

  const actions = (which: Side) => (
    <>
      <button
        type="button"
        className="btn btn-line btn-sm"
        disabled={busy}
        onClick={() => give(which, "random")}
      >
        Random
      </button>
      <button
        type="button"
        className="btn btn-line btn-sm"
        disabled={busy || teams[other(which)].length === 0}
        onClick={() => give(which, "counter")}
      >
        Counter
      </button>
    </>
  );

  const row = (which: Side, title: string) => (
    <TeamRow
      title={title}
      size={size}
      team={teams[which]}
      active={side === which}
      onActivate={() => setTarget(which)}
      onRemove={(slug) => remove(which, slug)}
      actions={actions(which)}
    />
  );

  return (
    <SetupShell
      top={
        <>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            <Segmented label="Size" value={size} options={SIZES} onChange={changeSize} />
            <Segmented
              label="Counters"
              value={difficulty}
              options={STRENGTHS}
              onChange={setDifficulty}
            />
            <Segmented
              label="Stake"
              value={risk}
              onChange={setStake}
              options={GLAZE.stakes.map((value) => ({
                value: value as number,
                label: value === 0 ? "Free" : String(value),
                disabled:
                  value > 0 && (balance === null || value > balance || stakesLeft === 0),
              }))}
            />
          </div>
          <p className="text-muted-foreground text-xs">
            Practice wins pay {FAIR.practice.win} Glaze, up to {FAIR.practice.dailyCap} a
            day, and a loss costs nothing. A stake pays by the odds and a lost stake is
            gone. {stakesLeft} of {FAIR.staked.perDay} stakes left today. Repeating a
            matchup pays nothing.
          </p>
          {row("a", "Your team")}
          {matchmade ? (
            <p className="border p-3 text-sm">
              <span className="eyebrow block">Opponent</span>
              The matchmaker picks your opponent after your first match each day, using
              the Counters setting.
            </p>
          ) : (
            row("b", "Opponent")
          )}
          {error ? (
            <p role="alert" className="border p-2 text-sm">
              {error}
            </p>
          ) : null}
        </>
      }
      picker={
        <RosterPicker
          label={side === "a" ? "Adding to your team" : "Adding to the opponent"}
          taken={taken}
          onPick={(card) => teams[side].length < size && add(card)}
        />
      }
      action={
        <button
          type="button"
          className="btn btn-solid w-full"
          disabled={!ready || busy}
          onClick={fight}
        >
          {busy
            ? "Working..."
            : ready
              ? risk > 0
                ? `Start the battle, stake ${risk}`
                : "Start the battle"
              : matchmade
                ? `Fill your team (${teams.a.length} of ${size})`
                : `Fill both teams (${teams.a.length + teams.b.length} of ${size * 2})`}
        </button>
      }
    />
  );
}
