"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { controlClass } from "@/components/ui/fields";
import type { ReportedList } from "@/lib/data/list-moderation";
import {
  LIST_REPORT_LABELS,
  type ListModAction,
  type ListReportReason,
} from "@/lib/lists/moderation";

const buttonClass =
  "min-h-11 border px-4 text-sm hover:bg-foreground/5 disabled:opacity-50";
const LABELS: Record<ListModAction, string> = {
  hide: "Hide list",
  restore: "Restore list",
  dismiss: "Dismiss reports",
};

export function ListQueueItem({ list }: { list: ReportedList }) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const actions: ListModAction[] =
    list.status === "visible" ? ["hide", "dismiss"] : ["restore"];

  async function act(action: ListModAction) {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/lists/moderate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ listId: list.id, action, note: note.trim() }),
      });
      if (response.ok) {
        router.refresh();
        return;
      }
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(data?.error ?? "Could not apply the action.");
    } catch {
      setError("Network error. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="space-y-4 border p-4">
      <header>
        <p className="font-medium">{list.title}</p>
        <p className="text-muted-foreground text-sm">
          by @{list.ownerHandle || "unknown"} ·{" "}
          {list.status === "hidden" ? "hidden" : "visible"} · {list.reports.length}{" "}
          {list.reports.length === 1 ? "report" : "reports"}
        </p>
      </header>

      <ol className="space-y-2 text-sm">
        {list.items.map((item, index) => (
          <li key={item.characterId}>
            <span className="tabular text-muted-foreground">{index + 1}.</span>{" "}
            <strong>{item.name}</strong>: {item.reason}
          </li>
        ))}
      </ol>

      <ul className="space-y-1 border-t pt-3 text-sm">
        {list.reports.map((report, index) => (
          <li key={index}>
            {LIST_REPORT_LABELS[report.reason as ListReportReason] ?? report.reason}
            {report.note ? `: ${report.note}` : ""}
          </li>
        ))}
      </ul>

      <input
        value={note}
        onChange={(event) => setNote(event.target.value)}
        maxLength={200}
        placeholder="Note (required to hide)"
        aria-label="Moderator note"
        className={controlClass}
      />

      <div className="flex flex-wrap gap-2">
        {actions.map((action) => (
          <button
            key={action}
            type="button"
            className={buttonClass}
            onClick={() => act(action)}
            disabled={busy}
          >
            {LABELS[action]}
          </button>
        ))}
      </div>

      {error ? (
        <p role="alert" className="text-sm font-medium">
          {error}
        </p>
      ) : null}
    </article>
  );
}
