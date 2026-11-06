"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Portrait } from "@/components/characters/portrait";
import { TierBadge } from "@/components/characters/tier-badge";
import { Modal } from "@/components/ui/modal";
import { useCharacterSearch } from "@/hooks/use-character-search";
import type { MatchupPreset } from "@/lib/matchup/preset";
import { randomPair } from "@/lib/matchup/random-pair";
import { OPEN_MATCHUP } from "@/lib/ui/events";
import { cn } from "@/lib/utils";

interface SlotProps {
  label: string;
  value: MatchupPreset | null;
  active: boolean;
  onSelect: () => void;
}

function Slot({ label, value, active, onSelect }: SlotProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      className={cn(
        "flex min-h-24 items-center gap-3 border p-3 text-left transition-colors hover:bg-muted",
        active && "border-foreground [box-shadow:inset_0_-2px_0_var(--color-accent)]",
      )}
    >
      {value ? (
        <Portrait name={value.name} src={value.imageUrl} sizes="56px" className="aspect-2/3 w-12 shrink-0" />
      ) : (
        <span
          className="grid aspect-2/3 w-12 shrink-0 place-items-center border border-dashed text-muted-foreground"
          aria-hidden
        >
          ?
        </span>
      )}
      <span className="min-w-0">
        <span className="eyebrow block">{label}</span>
        <span className="block truncate font-display text-lg font-semibold">{value ? value.name : "Choose"}</span>
        {value ? <span className="eyebrow block truncate">{value.verse}</span> : null}
      </span>
    </button>
  );
}

function MakerPanel({ preset, onDone }: { preset: MatchupPreset | null; onDone: () => void }) {
  const router = useRouter();
  const { text, change, results, list, failed } = useCharacterSearch();
  const [a, setA] = useState<MatchupPreset | null>(preset);
  const [b, setB] = useState<MatchupPreset | null>(null);
  const [slot, setSlot] = useState<"a" | "b">(preset ? "b" : "a");
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState(false);

  const other = slot === "a" ? b : a;
  const choices = list.filter((item) => item.id !== other?.id);
  const ready = a !== null && b !== null && a.id !== b.id;

  function pick(character: MatchupPreset) {
    if (slot === "a") {
      setA(character);
      if (!b) setSlot("b");
    } else {
      setB(character);
      if (!a) setSlot("a");
    }
  }

  function compare() {
    if (!a || !b || !ready) return;
    onDone();
    router.push(`/matchups/${a.id}/${b.id}`);
  }

  async function surprise() {
    setBusy(true);
    setProblem(false);
    const pair = await randomPair();
    setBusy(false);
    if (!pair) {
      setProblem(true);
      return;
    }
    onDone();
    router.push(`/matchups/${pair[0]}/${pair[1]}`);
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <Slot label="First character" value={a} active={slot === "a"} onSelect={() => setSlot("a")} />
        <Slot label="Second character" value={b} active={slot === "b"} onSelect={() => setSlot("b")} />
      </div>

      <div>
        <label className="block">
          <span className="eyebrow mb-1 block">Search for the {slot === "a" ? "first" : "second"} character</span>
          <input
            autoFocus
            value={text}
            onChange={(event) => change(event.target.value)}
            maxLength={60}
            placeholder="Name or verse"
            autoComplete="off"
            spellCheck={false}
            className="h-11 w-full border bg-background px-3 text-sm outline-none placeholder:text-muted-foreground focus:border-foreground"
          />
        </label>

        <p className="eyebrow mt-3 mb-2">{results ? "Results" : "Top ranked"}</p>
        {results && choices.length === 0 ? (
          <p className="border p-3 text-sm text-muted-foreground">
            {failed ? "Search is unavailable right now." : "No character matches that."}
          </p>
        ) : (
          <ul className="max-h-60 divide-y overflow-y-auto border">
            {choices.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => pick(c)}
                  className="flex w-full items-center gap-3 p-2.5 text-left transition-colors hover:bg-muted"
                >
                  <Portrait name={c.name} src={c.imageUrl} sizes="40px" className="aspect-2/3 w-8 shrink-0" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-display text-base font-semibold">{c.name}</span>
                    <span className="eyebrow block truncate">{c.verse}</span>
                  </span>
                  <TierBadge tier={c.tier} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {problem ? (
        <p role="alert" className="text-sm font-medium">
          Could not pick a random matchup right now.
        </p>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-5">
        <button type="button" className="btn btn-line" disabled={busy} onClick={() => void surprise()}>
          Surprise me
        </button>
        <button type="button" className="btn btn-solid" disabled={!ready} onClick={compare}>
          {ready ? "Compare" : "Pick two characters"}
        </button>
      </div>
    </div>
  );
}

export function MatchupMaker() {
  const [open, setOpen] = useState(false);
  const [preset, setPreset] = useState<MatchupPreset | null>(null);

  useEffect(() => {
    const show = (event: Event) => {
      const detail = (event as CustomEvent<{ preset?: MatchupPreset | null }>).detail;
      setPreset(detail?.preset ?? null);
      setOpen(true);
    };
    window.addEventListener(OPEN_MATCHUP, show);
    return () => window.removeEventListener(OPEN_MATCHUP, show);
  }, []);

  return (
    <Modal wide open={open} onClose={() => setOpen(false)} eyebrow="Head to head" title="New matchup">
      <MakerPanel key={preset?.id ?? "none"} preset={preset} onDone={() => setOpen(false)} />
    </Modal>
  );
}