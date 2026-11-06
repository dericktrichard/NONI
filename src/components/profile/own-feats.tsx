import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { OwnFeat } from "@/lib/data/activity";

const LABELS: Record<string, string> = { verified: "Verified", pending: "Pending", rejected: "Rejected" };

export function OwnFeats({ feats }: { feats: OwnFeat[] }) {
  if (feats.length === 0) {
    return (
      <p className="mt-6 border p-4 text-sm text-muted-foreground">
        You have not submitted any feats yet. Open a character and use Submit a feat.
      </p>
    );
  }

  return (
    <>
      <p className="mt-2 text-sm text-muted-foreground">
        Only you see this list. On character pages your feats appear under an anonymous name.
      </p>
      <ul className="mt-6 divide-y border">
        {feats.map((feat) => (
          <li key={feat.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 p-4">
            <Badge variant={feat.status === "verified" ? "accent" : "outline"}>
              {LABELS[feat.status] ?? feat.status}
            </Badge>
            <div className="min-w-0 flex-1">
              <Link href={`/characters/${feat.characterId}`} className="font-medium underline underline-offset-4">
                {feat.title}
              </Link>
              <p className="eyebrow mt-1 truncate">
                {feat.characterName} / {feat.createdAt}
              </p>
            </div>
            <span className="tabular text-sm">{feat.netScore > 0 ? `+${feat.netScore}` : feat.netScore}</span>
          </li>
        ))}
      </ul>
    </>
  );
}