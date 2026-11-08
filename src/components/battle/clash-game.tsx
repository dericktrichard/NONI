"use client";

import { useState } from "react";
import { Arena } from "@/components/battle/arena";
import { TeamRow } from "@/components/battle/team-row";
import { CharacterFinder } from "@/components/characters/character-finder";
import { useGlaze } from "@/hooks/use-glaze";
import { OPEN_SIGN_IN } from "@/lib/auth/events";
import { BATTLE } from "@/lib/battle/config";
import { postJson } from "@/lib/battle/client";
import type { Difficulty } from "@/lib/battle/types";
import type { BattleCard } from "@/lib/battle/view";
import type { ClashOutcome } from "@/lib/data/battles";
import { cn } from "@/lib/utils";

type Side = "a" | "b";
const DIFFICULTIES: Difficulty[] = ["fair", "hard"];

export function ClashGame() {
  const [size, setSize] = useState<number>(BATTLE.teamSizes[0]);
  const [teams, setTeams] = useState<Record<Side, BattleCard[]>>({ a: [], b: [] });
  const [target, setTarget] = useState<Side>("a");
  const [difficulty, setDifficulty] = useState<Difficulty>("fair");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<ClashOutcome | null>(null);
  const [balance, setBalance] = useGlaze();

  const taken = new Set([...teams.a, ...teams.b].map((card) => card.slug));
  const ready = teams.a.length === size && teams.b.length === size;
  const other = (side: Side): Side => (side === "a" ? "b" : "a");

  async function request<T>(url: string, body: unknown): Promise<T | null> {
    setBusy(true);
    const reply = await postJson<T>(url, body);
    setBusy(false);
    if (reply.ok) {
      setError(null);
      return reply.data;
    }
    if (reply.status === 401) window.dispatchEvent(new Event(OPEN_SIGN_IN));
    setError(reply.status === 401 ? "Sign in to battle." : reply.error);
    return null;
  }

  function changeSize(next: number) {
    setSize(next);
    setTeams((current) => ({ a: current.a.slice(0, next), b: current.b.slice(0, next) }));
  }

  function add(card: BattleCard) {
    const filled = [...teams[target], card];
    setTeams({ ...teams, [target]: filled });
    if (filled.length === size && teams[other(target)].length < size) setTarget(other(target));
  }

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
    });
    if (!data) return;
    setBalance(data.reward.balance);
    setOutcome(data);
  }

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

  return (
    <div className="mt-8">
      <p className="eyebrow">Glaze</p>
      <p className="tabular font-display text-3xl font-semibold">{balance === null ? "-" : balance.toLocaleString("en-US")}</p>

      {outcome ? (
        <div className="mt-6">
          <Arena outcome={outcome} onChange={() => setOutcome(null)} />
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <div role="group" aria-label="Team size" className="flex border-b">
              {BATTLE.teamSizes.map((option) => (
                <button
                  key={option}
                  type="button"
                  aria-pressed={size === option}
                  onClick={() => changeSize(option)}
                  className={cn(
                    "h-11 border-b-2 border-transparent px-4 text-sm font-medium hover:bg-muted",
                    size === option && "border-b-accent",
                  )}
                >
                  {option} v {option}
                </button>
              ))}
            </div>
            <div role="group" aria-label="Counter strength" className="flex border-b">
              {DIFFICULTIES.map((option) => (
                <button
                  key={option}
                  type="button"
                  aria-pressed={difficulty === option}
                  onClick={() => setDifficulty(option)}
                  className={cn(
                    "h-11 border-b-2 border-transparent px-4 text-sm font-medium capitalize hover:bg-muted",
                    difficulty === option && "border-b-accent",
                  )}
                >
                  {option} counters
                </button>
              ))}
            </div>
          </div>

          <TeamRow
            title="Your team"
            size={size}
            team={teams.a}
            active={target === "a"}
            onActivate={() => setTarget("a")}
            onRemove={(slug) => setTeams((c) => ({ ...c, a: c.a.filter((card) => card.slug !== slug) }))}
            actions={actions("a")}
          />
          <TeamRow
            title="Opponent"
            size={size}
            team={teams.b}
            active={target === "b"}
            onActivate={() => setTarget("b")}
            onRemove={(slug) => setTeams((c) => ({ ...c, b: c.b.filter((card) => card.slug !== slug) }))}
            actions={actions("b")}
          />

          {teams[target].length < size ? (
            <CharacterFinder
              label={target === "a" ? "Adding to your team" : "Adding to the opponent"}
              isDisabled={(c) => taken.has(c.id)}
              onPick={(c) => add({ slug: c.id, name: c.name, verse: c.verse, imageUrl: c.imageUrl, rank: null })}
            />
          ) : null}

          {error ? (
            <p role="alert" className="border p-3 text-sm">
              {error}
            </p>
          ) : null}

          <button type="button" className="btn btn-solid w-full" disabled={!ready || busy} onClick={fight}>
            {busy ? "Working..." : ready ? "Start the battle" : `Fill both teams (${teams.a.length + teams.b.length} of ${size * 2})`}
          </button>
        </div>
      )}
    </div>
  );
}