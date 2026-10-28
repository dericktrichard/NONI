"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { controlClass } from "@/components/ui/fields";
import type { QueueArgument } from "@/lib/data/mod-queue";
import { REPORT_REASON_LABELS } from "@/lib/moderation/actions";
import {
  ARGUMENT_ACTION_LABELS,
  actionsFor,
  argumentNeedsNote,
  type ArgumentAction,
} from "@/lib/moderation/argument-actions";

export function ArgumentQueueItem({ item }: { item: QueueArgument }) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(action: ArgumentAction) {
    if (argumentNeedsNote(action) && note.trim().length < 5) {
      setError("Give a reason of at least 5 characters.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/arguments/moderate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          a: item.a,
          b: item.b,
          argumentId: item.argumentId,
          action,
          note: note.trim() || undefined,
        }),
      });
      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        setError(data?.error ?? "Action failed.");
        return;
      }
      setNote("");
      router.refresh();
    } catch {
      setError("Action failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <li className="border-b py-6">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <Badge variant={item.status === "visible" ? "outline" : "accent"}>{item.status}</Badge>
        <span className="eyebrow tabular">
          +{item.upvotes} / -{item.downvotes}
        </span>
      </div>

      <p className="eyebrow mt-2">
        {item.a} vs {item.b} / argues for {item.sideSlug} / {item.authorName} / {item.createdAt.slice(0, 10)}
      </p>
      <p className="mt-2 text-sm whitespace-pre-line text-foreground/80">{item.body}</p>

      <ul className="mt-3 space-y-1">
        {item.citations.map((citation) => (
          <li key={`${citation.characterId}/${citation.featId}`} className="text-sm">
            <span className="eyebrow mr-2">Cites</span>
            {citation.title || citation.featId}
          </li>
        ))}
      </ul>

      <p className="mt-3 text-sm">
        <Link href={`/matchups/${item.a}/${item.b}`} className="underline underline-offset-4">
          Open the matchup
        </Link>
      </p>

      <div className="mt-4 border p-3 text-sm">
        <p className="eyebrow">{item.reports.length} open report(s)</p>
        <ul className="mt-2 space-y-1">
          {item.reports.map((report, index) => (
            <li key={index}>
              {REPORT_REASON_LABELS[report.reason]}
              {report.note ? `: ${report.note}` : ""}
            </li>
          ))}
        </ul>
      </div>

      <label className="mt-4 block">
        <span className="eyebrow">Reason (required to hide)</span>
        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          maxLength={500}
          rows={2}
          className={controlClass}
        />
      </label>

      <div className="mt-3 flex flex-wrap gap-2">
        {actionsFor(item.status).map((action) => (
          <button
            key={action}
            type="button"
            disabled={busy}
            onClick={() => run(action)}
            className="min-h-11 border px-4 text-sm hover:bg-muted disabled:opacity-40"
          >
            {ARGUMENT_ACTION_LABELS[action]}
          </button>
        ))}
      </div>

      {error ? (
        <p role="alert" className="mt-2 text-sm">
          {error}
        </p>
      ) : null}
    </li>
  );
}