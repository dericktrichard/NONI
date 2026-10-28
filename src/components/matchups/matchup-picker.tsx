"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { controlClass } from "@/components/ui/fields";
import type { CharacterOption } from "@/lib/data/matchup-page";

export function MatchupPicker({ options }: { options: CharacterOption[] }) {
  const router = useRouter();
  const [a, setA] = useState("");
  const [b, setB] = useState("");

  const ready = a !== "" && b !== "" && a !== b;

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (ready) router.push(`/matchups/${a}/${b}`);
  }

  return (
    <form onSubmit={submit} className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
      <label className="block text-sm">
        <span className="mb-1 block font-medium">First character</span>
        <select value={a} onChange={(event) => setA(event.target.value)} className={controlClass}>
          <option value="">Select</option>
          {options.map((option) => (
            <option key={option.slug} value={option.slug}>
              {option.name}
            </option>
          ))}
        </select>
      </label>

      <label className="block text-sm">
        <span className="mb-1 block font-medium">Second character</span>
        <select value={b} onChange={(event) => setB(event.target.value)} className={controlClass}>
          <option value="">Select</option>
          {options.map((option) => (
            <option key={option.slug} value={option.slug} disabled={option.slug === a}>
              {option.name}
            </option>
          ))}
        </select>
      </label>

      <Button type="submit" variant="primary" disabled={!ready}>
        Compare
      </Button>
    </form>
  );
}