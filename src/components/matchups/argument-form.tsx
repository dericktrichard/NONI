"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { controlClass } from "@/components/ui/fields";
import type { CitableFeat } from "@/lib/data/matchup-page";
import { OPEN_SIGN_IN } from "@/lib/auth/events";
import { MAX_CITATIONS } from "@/lib/matchup/arguments";

interface Side {
  slug: string;
  name: string;
}

interface ArgumentFormProps {
  a: Side;
  b: Side;
  citable: CitableFeat[];
}

const keyOf = (feat: CitableFeat) => `${feat.characterId}/${feat.featId}`;

export function ArgumentForm({ a, b, citable }: ArgumentFormProps) {
  const router = useRouter();
  const [side, setSide] = useState<"a" | "b" | "">("");
  const [body, setBody] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  if (citable.length === 0) {
    return (
      <p className="mt-4 text-sm text-muted-foreground">
        Arguments must cite verified feats, and neither character has one yet.
      </p>
    );
  }

  const ready = side !== "" && body.trim().length >= 20 && selected.length >= 1;

  function toggle(key: string) {
    setSelected((current) =>
      current.includes(key) ? current.filter((item) => item !== key) : [...current, key].slice(0, MAX_CITATIONS),
    );
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!ready) return;

    const citations = citable
      .filter((feat) => selected.includes(keyOf(feat)))
      .map((feat) => ({ characterId: feat.characterId, featId: feat.featId }));

    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch("/api/matchups/arguments", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ a: a.slug, b: b.slug, side, body: body.trim(), citations }),
      });
      if (response.status === 401) {
        window.dispatchEvent(new Event(OPEN_SIGN_IN));
        setMessage("Sign in to post an argument.");
        return;
      }
      if (response.status === 201) {
        setBody("");
        setSelected([]);
        setSide("");
        setMessage("Posted.");
        router.refresh();
        return;
      }
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      setMessage(data?.error ?? "Could not post your argument.");
    } catch {
      setMessage("Network error. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-6 space-y-5 border p-4 sm:p-6">
      <h3 className="font-display text-xl font-semibold tracking-tight">Make your case</h3>

      <fieldset>
        <legend className="eyebrow mb-2">Who wins?</legend>
        <div className="grid grid-cols-2 gap-3">
          {([a, b] as const).map((option, index) => {
            const value = index === 0 ? "a" : "b";
            return (
              <label
                key={option.slug}
                className="flex min-h-11 cursor-pointer items-center gap-2 border px-3 text-sm has-checked:bg-foreground has-checked:text-background"
              >
                <input
                  type="radio"
                  name="side"
                  value={value}
                  checked={side === value}
                  onChange={() => setSide(value)}
                  className="sr-only"
                />
                <span className="truncate">{option.name}</span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <label className="block text-sm">
        <span className="mb-1 block font-medium">Your argument (20 to 1000 characters)</span>
        <textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          maxLength={1000}
          rows={5}
          className={`${controlClass} h-auto py-2`}
        />
      </label>

      <fieldset>
        <legend className="eyebrow mb-2">
          Cite verified feats ({selected.length} of {MAX_CITATIONS})
        </legend>
        <ul className="space-y-2">
          {citable.map((feat) => {
            const key = keyOf(feat);
            const checked = selected.includes(key);
            return (
              <li key={key}>
                <label className="flex min-h-11 cursor-pointer items-start gap-3 text-sm">
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={!checked && selected.length >= MAX_CITATIONS}
                    onChange={() => toggle(key)}
                    className="mt-1 size-4"
                  />
                  <span>
                    <span className="eyebrow block">{feat.characterName}</span>
                    {feat.title}
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      </fieldset>

      <div className="flex items-center gap-3">
        <Button type="submit" variant="primary" disabled={busy || !ready}>
          Post argument
        </Button>
        {message ? (
          <p role="status" className="text-sm">
            {message}
          </p>
        ) : null}
      </div>
    </form>
  );
}