"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ReportedImage } from "@/lib/data/image-moderation";
import { IMAGE_REPORT_LABELS, type ImageModAction } from "@/lib/profile/image-moderation";
import { cn } from "@/lib/utils";

const labels = IMAGE_REPORT_LABELS as Record<string, string>;

export function ImageQueueItem({ item }: { item: ReportedImage }) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function act(action: ImageModAction) {
    if (action !== "dismiss" && note.trim().length < 3) {
      setError("Add a note explaining why.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/profile-images/moderate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ uid: item.uid, kind: item.kind, action, note }),
      });
      if (response.ok) {
        router.refresh();
        return;
      }
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(data?.error ?? "Could not apply that action.");
    } catch {
      setError("Network error. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="border p-4">
      <div className="flex items-baseline justify-between gap-4">
        <p className="text-sm font-medium">
          <Link href={`/u/${item.handle}`} className="hover:underline">
            @{item.handle}
          </Link>{" "}
          <span className="eyebrow">{item.kind}</span>
        </p>
        <p className="eyebrow">
          {item.reports.length} report{item.reports.length === 1 ? "" : "s"}
        </p>
      </div>

      <div
        className={cn(
          "bg-muted relative mt-3 overflow-hidden border",
          item.kind === "avatar" ? "aspect-square w-32" : "aspect-8/3 w-full max-w-md",
        )}
      >
        <Image src={item.imageUrl} alt="" fill sizes="448px" className="object-cover" />
      </div>

      <ul className="mt-3 space-y-1 text-sm">
        {item.reports.map((report, index) => (
          <li key={index}>
            {labels[report.reason] ?? report.reason}
            {report.note ? (
              <span className="text-muted-foreground">: {report.note}</span>
            ) : null}
          </li>
        ))}
      </ul>

      {item.blocked ? <p className="eyebrow mt-3">Uploads already blocked</p> : null}

      <input
        className="bg-background mt-3 w-full border px-3 py-2 text-sm"
        placeholder="Note for the log"
        maxLength={200}
        value={note}
        onChange={(event) => setNote(event.target.value)}
      />

      {error ? (
        <p role="alert" className="mt-2 text-sm font-medium">
          {error}
        </p>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          className="btn btn-solid btn-sm"
          disabled={busy}
          onClick={() => void act("remove")}
        >
          Remove image
        </button>
        <button
          type="button"
          className="btn btn-line btn-sm"
          disabled={busy}
          onClick={() => void act("block")}
        >
          Remove and block uploads
        </button>
        <button
          type="button"
          className="btn btn-quiet btn-sm"
          disabled={busy}
          onClick={() => void act("dismiss")}
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
