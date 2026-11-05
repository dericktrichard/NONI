import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import type { CharacterView } from "@/types/character-page";
import { EvidenceMeter } from "./evidence-meter";

export function CharacterAside({ c }: { c: CharacterView }) {
  return (
    <aside className="order-first space-y-4 lg:sticky lg:top-[calc(var(--nav-space)+1rem)] lg:order-0 lg:self-start">
      <div className="border p-4">
        <p className="eyebrow">Evidence</p>
        <div className="mt-3">
          <EvidenceMeter value={c.evidence} segments={12} />
        </div>
        <p className="mt-3 font-display text-lg font-semibold">
          {c.verifiedFeatCount} of {c.featCount} feats verified
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Only verified feats move the profile and the rank. Pending feats wait for community votes.
        </p>
      </div>

      <Link
        href={`/matchups?a=${c.id}`}
        className="group flex items-center justify-between gap-4 bg-accent p-4 text-accent-foreground transition-[filter] hover:brightness-95"
      >
        <span className="font-display text-xl leading-tight font-semibold">Compare with another character</span>
        <ArrowUpRight
          className="size-6 shrink-0 transition-transform duration-200 group-hover:translate-x-1 group-hover:-translate-y-1"
          aria-hidden
        />
      </Link>
    </aside>
  );
}