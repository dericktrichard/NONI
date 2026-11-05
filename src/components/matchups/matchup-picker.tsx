"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { controlClass } from "@/components/ui/fields";
import type { CharacterOption } from "@/lib/data/matchup-page";

interface SlotProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: CharacterOption[];
  taken: string;
}

function Slot({ label, value, onChange, options, taken }: SlotProps) {
  return (
    <label className="block p-4 sm:p-5">
      <span className="eyebrow mb-2 block">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className={controlClass}>
        <option value="">Select</option>
        {options.map((option) => (
          <option key={option.slug} value={option.slug} disabled={option.slug === taken}>
            {option.name}
          </option>
        ))}
      </select>
    </label>
  );
}

export function MatchupPicker({ options }: { options: CharacterOption[] }) {
  const router = useRouter();
  const preset = useSearchParams().get("a");
  const [a, setA] = useState(() => (preset !== null && options.some((option) => option.slug === preset) ? preset : ""));
  const [b, setB] = useState("");

  const ready = a !== "" && b !== "" && a !== b;

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (ready) router.push(`/matchups/${a}/${b}`);
  }

  return (
    <form onSubmit={submit} className="border">
      <div className="grid sm:grid-cols-[1fr_auto_1fr]">
        <Slot label="First character" value={a} onChange={setA} options={options} taken={b} />
        <span
          className="grid h-9 place-items-center border-y bg-muted font-display text-sm font-semibold text-muted-foreground sm:h-auto sm:w-14 sm:border-x sm:border-y-0"
          aria-hidden
        >
          VS
        </span>
        <Slot label="Second character" value={b} onChange={setB} options={options} taken={a} />
      </div>

      <div className="flex items-center justify-between gap-4 border-t p-4 sm:px-5">
        <p className="text-sm text-muted-foreground">{ready ? "Ready to compare." : "Pick two different characters."}</p>
        <button type="submit" disabled={!ready} className="btn btn-solid">
          Compare
        </button>
      </div>
    </form>
  );
}