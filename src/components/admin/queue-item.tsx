"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ProofItem } from "@/components/feats/feat-card";
import { Badge } from "@/components/ui/badge";
import { controlClass } from "@/components/ui/fields";
import { claimLabel } from "@/lib/feats/labels";
import { MOD_ACTION_LABELS, REPORT_REASON_LABELS, needsNote, type ModAction } from "@/lib/moderation/actions";
import type { QueueFeat } from "@/lib/data/mod-queue";

export function QueueItem({ feat }: { feat: QueueFeat }) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const actions: ModAction[] = ["verify", "reject"];
  if (feat.staffLocked) actions.push("reset");
  if (feat.openReports > 0) actions.push("dismiss");

  async function run(action: ModAction) {
    if (needsNote(action) && note.trim().length < 5) {
      setError("Give a reason of at least 5 characters.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/feats/moderate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          characterId: feat.characterId,
          featId: feat.id,
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
        <Badge variant={feat.status === "verified" ? "accent" : "outline"}>{feat.status}</Badge>
        {feat.staffLocked ? <Badge variant="outline">Locked by staff</Badge> : null}
        <span className="eyebrow">{claimLabel(feat.claim)}</span>
        <span className="eyebrow tabular">
          +{feat.upvotes} / -{feat.downvotes}
        </span>
      </div>

      <h3 className="mt-2 font-display text-lg leading-snug font-semibold">{feat.title}</h3>
      <p className="eyebrow mt-1">
        {feat.characterId} / {feat.authorName} / {feat.createdAt.slice(0, 10)}
      </p>
      <p className="mt-2 text-sm whitespace-pre-line text-foreground/80">{feat.description}</p>

      <ul className="mt-3 space-y-2">
        {feat.proofs.map((proof, index) => (
          <ProofItem key={index} proof={proof} />
        ))}
      </ul>

      {feat.openReports > 0 ? (
        <div className="mt-4 border p-3 text-sm">
          <p className="eyebrow">{feat.openReports} open report(s)</p>
          <ul className="mt-2 space-y-1">
            {feat.reports.map((report, index) => (
              <li key={index}>
                {REPORT_REASON_LABELS[report.reason]}
                {report.note ? `: ${report.note}` : ""}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <label className="mt-4 block">
        <span className="eyebrow">Reason (required to verify or reject)</span>
        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          maxLength={500}
          rows={2}
          className={controlClass}
        />
      </label>

      <div className="mt-3 flex flex-wrap gap-2">
        {actions.map((action) => (
          <button
            key={action}
            type="button"
            disabled={busy}
            onClick={() => run(action)}
            className="min-h-11 border px-4 text-sm hover:bg-muted disabled:opacity-40"
          >
            {MOD_ACTION_LABELS[action]}
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