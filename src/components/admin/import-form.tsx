"use client";

import Link from "next/link";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, controlClass } from "@/components/ui/fields";
import type { PlannedRow } from "@/lib/import/rows";

const MAX_BYTES = 400_000;

interface Reply {
  items?: PlannedRow[];
  created?: number;
  error?: string;
}

export function ImportForm() {
  const [text, setText] = useState("");
  const [review, setReview] = useState<{ items: PlannedRow[]; text: string } | null>(
    null,
  );
  const [created, setCreated] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function call(op: "preview" | "commit"): Promise<Reply | null> {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/characters/import", {
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
    if (json?.items) setReview({ items: json.items, text });
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

  const fresh = review !== null && review.text === text ? review : null;
  const count = (status: PlannedRow["status"]) =>
    fresh ? fresh.items.filter((item) => item.status === status).length : 0;
  const incoming = count("new");

  return (
    <div className="mt-8 max-w-3xl space-y-6">
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
      </Field>
      <Field label="Or paste it here">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={10}
          spellCheck={false}
          className={`${controlClass} font-mono text-xs`}
        />
      </Field>

      <div className="flex flex-wrap gap-3">
        <Button
          variant="outline"
          disabled={busy || text.trim() === ""}
          onClick={() => void preview()}
        >
          {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
          Preview
        </Button>
        <Button
          variant="primary"
          disabled={busy || incoming === 0}
          onClick={() => void commit()}
        >
          Import {incoming > 0 ? `${incoming} as drafts` : ""}
        </Button>
      </div>

      {error ? (
        <p role="alert" className="text-sm font-medium">
          {error}
        </p>
      ) : null}

      {created !== null ? (
        <p role="status" className="border p-3 text-sm">
          Created {created} drafts.{" "}
          <Link href="/admin/characters" className="underline underline-offset-4">
            See them in the list
          </Link>
        </p>
      ) : null}

      {fresh ? (
        <section aria-label="Preview">
          <p className="eyebrow">
            {count("new")} new, {count("exists")} already stored, {count("invalid")}{" "}
            refused
          </p>
          <ul className="mt-3 divide-y border-y">
            {fresh.items.map((item) => (
              <li
                key={item.index}
                className="flex flex-wrap items-baseline gap-x-3 py-2 text-sm"
              >
                <span className="eyebrow tabular w-8">{item.index + 1}</span>
                <span className="min-w-0 flex-1 truncate font-medium">{item.name}</span>
                <span className="eyebrow">{item.slug || "no slug"}</span>
                <span
                  className={
                    item.status === "invalid" ? "font-medium" : "text-muted-foreground"
                  }
                >
                  {item.status === "new" ? "New draft" : (item.reason ?? item.status)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
