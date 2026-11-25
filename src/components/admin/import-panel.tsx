"use client";

import Link from "next/link";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { Field, controlClass } from "@/components/ui/fields";
import type { PlannedFeat } from "@/lib/import/feats";
import type { PlannedRow } from "@/lib/import/rows";
import { cn } from "@/lib/utils";

type Kind = "characters" | "feats";
type Status = "new" | "exists" | "invalid";

interface Line {
  index: number;
  title: string;
  meta: string;
  status: Status;
  reason: string | null;
}

interface Reply {
  items?: Array<PlannedRow | PlannedFeat>;
  created?: number;
  error?: string;
}

const MAX_BYTES = 400_000;

const KINDS: Record<
  Kind,
  {
    label: string;
    endpoint: string;
    newLabel: string;
    done: (count: number) => string;
    doneHref: string;
    doneLabel: string;
    commit: (count: number) => string;
  }
> = {
  characters: {
    label: "Characters",
    endpoint: "/api/admin/characters/import",
    newLabel: "New draft",
    done: (count) => `Created ${count} drafts.`,
    doneHref: "/admin/characters",
    doneLabel: "See them in the list",
    commit: (count) => (count > 0 ? `Import ${count} as drafts` : "Import"),
  },
  feats: {
    label: "Feats",
    endpoint: "/api/admin/feats/import",
    newLabel: "New pending feat",
    done: (count) => `Created ${count} pending feats.`,
    doneHref: "/admin/moderation?tab=pending",
    doneLabel: "See them in the queue",
    commit: (count) => (count > 0 ? `Import ${count} as pending feats` : "Import"),
  },
};

const STEPS = ["Choose a file", "Preview", "Import"];

function toLine(kind: Kind, item: PlannedRow | PlannedFeat): Line {
  if (kind === "characters") {
    const row = item as PlannedRow;
    return {
      index: row.index,
      title: row.name,
      meta: row.slug || "no slug",
      status: row.status as Status,
      reason: row.reason ?? null,
    };
  }
  const feat = item as PlannedFeat;
  return {
    index: feat.index,
    title: feat.title,
    meta: feat.characterId,
    status: feat.status as Status,
    reason: feat.reason ?? null,
  };
}

function Count({ label, value, mark }: { label: string; value: number; mark?: boolean }) {
  return (
    <div className="px-4 py-3">
      <dt className="eyebrow flex items-center gap-2">
        {mark && value > 0 ? <span className="bg-accent size-1.5" aria-hidden /> : null}
        {label}
      </dt>
      <dd className="tabular font-display text-2xl font-semibold">{value}</dd>
    </div>
  );
}

function ImportTab({ kind }: { kind: Kind }) {
  const config = KINDS[kind];
  const [text, setText] = useState("");
  const [review, setReview] = useState<{ lines: Line[]; text: string } | null>(null);
  const [created, setCreated] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function call(op: "preview" | "commit"): Promise<Reply | null> {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(config.endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ op, text }),
      });
      const json = (await response.json().catch(() => null)) as Reply | null;
      if (!response.ok) {
        setError(json?.error ?? "Something went wrong.");
        return null;
      }
      return json;
    } catch {
      setError("Network error. Try again.");
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function preview() {
    setCreated(null);
    const json = await call("preview");
    if (json?.items)
      setReview({ lines: json.items.map((item) => toLine(kind, item)), text });
  }

  async function commit() {
    const json = await call("commit");
    if (json && typeof json.created === "number") {
      setCreated(json.created);
      setReview(null);
    }
  }

  async function readFile(file: File) {
    if (file.size > MAX_BYTES) {
      setError("The file must be under 400 KB.");
      return;
    }
    setError(null);
    setReview(null);
    setCreated(null);
    setText(await file.text());
  }

  function clear() {
    setText("");
    setReview(null);
    setCreated(null);
    setError(null);
  }

  const fresh = review !== null && review.text === text ? review : null;
  const count = (status: Status) =>
    fresh ? fresh.lines.filter((line) => line.status === status).length : 0;
  const incoming = count("new");
  const step = created !== null ? 3 : fresh ? 2 : 1;

  return (
    <div className="space-y-6">
      <ol className="grid grid-cols-3 border" aria-label="Steps">
        {STEPS.map((label, i) => (
          <li
            key={label}
            aria-current={i + 1 === step ? "step" : undefined}
            className={cn(
              "eyebrow px-3 py-2",
              i > 0 && "border-l",
              i + 1 === step && "bg-muted text-foreground",
            )}
          >
            <span className="tabular mr-2">{i + 1}</span>
            {label}
          </li>
        ))}
      </ol>

      <div className="grid gap-6 lg:grid-cols-2">
        <Field label="JSON file">
          <input
            type="file"
            accept="application/json,.json"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void readFile(file);
              e.target.value = "";
            }}
            className="file:bg-muted block w-full text-sm file:mr-3 file:border file:px-3 file:py-2"
          />
          <p className="text-muted-foreground mt-2 text-xs">Up to 400 KB per file.</p>
        </Field>

        <Field label="Or paste it here">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={8}
            spellCheck={false}
            className={`${controlClass} font-mono text-xs`}
          />
        </Field>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="btn btn-line btn-sm"
          disabled={busy || text.trim() === ""}
          onClick={() => void preview()}
        >
          {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
          Preview
        </button>
        <button
          type="button"
          className="btn btn-solid btn-sm"
          disabled={busy || incoming === 0}
          onClick={() => void commit()}
        >
          {config.commit(incoming)}
        </button>
        {text !== "" ? (
          <button
            type="button"
            className="btn btn-quiet btn-sm"
            disabled={busy}
            onClick={clear}
          >
            Clear
          </button>
        ) : null}
      </div>

      {error ? (
        <p role="alert" className="border-foreground border-l-2 pl-3 text-sm font-medium">
          {error}
        </p>
      ) : null}

      {created !== null ? (
        <p role="status" className="border p-4 text-sm">
          {config.done(created)}{" "}
          <Link href={config.doneHref} className="underline underline-offset-4">
            {config.doneLabel}
          </Link>
        </p>
      ) : null}

      {fresh ? (
        <section aria-label="Preview">
          <dl className="grid grid-cols-3 divide-x border">
            <Count label="New" value={count("new")} mark />
            <Count label="Already stored" value={count("exists")} />
            <Count label="Refused" value={count("invalid")} />
          </dl>
          <ul className="mt-4 divide-y border">
            {fresh.lines.map((line) => (
              <li
                key={line.index}
                className="flex flex-wrap items-baseline gap-x-3 px-4 py-2 text-sm"
              >
                <span className="eyebrow tabular w-8">{line.index + 1}</span>
                <span className="min-w-0 flex-1 truncate font-medium">{line.title}</span>
                <span className="eyebrow">{line.meta}</span>
                <span
                  className={
                    line.status === "invalid" ? "font-medium" : "text-muted-foreground"
                  }
                >
                  {line.status === "new" ? config.newLabel : (line.reason ?? line.status)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

export function ImportPanel({ initial }: { initial: Kind }) {
  const [kind, setKind] = useState<Kind>(initial);

  return (
    <div className="max-w-3xl">
      <div role="group" aria-label="What to import" className="mb-6 flex border-b">
        {(Object.keys(KINDS) as Kind[]).map((key) => (
          <button
            key={key}
            type="button"
            aria-pressed={kind === key}
            onClick={() => setKind(key)}
            className={cn(
              "hover:bg-muted h-11 border-b-2 border-transparent px-4 text-sm font-medium transition-colors",
              kind === key && "border-b-accent",
            )}
          >
            {KINDS[key].label}
          </button>
        ))}
      </div>

      <div className={cn(kind !== "characters" && "hidden")}>
        <ImportTab kind="characters" />
      </div>
      <div className={cn(kind !== "feats" && "hidden")}>
        <ImportTab kind="feats" />
      </div>
    </div>
  );
}
