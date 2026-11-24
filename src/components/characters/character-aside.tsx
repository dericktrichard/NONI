import type { CharacterView } from "@/types/character-page";
import { EvidenceMeter } from "./evidence-meter";

export function CharacterAside({
  c,
  children,
}: {
  c: CharacterView;
  children?: React.ReactNode;
}) {
  return (
    <aside className="order-first space-y-3 lg:sticky lg:top-[calc(var(--nav-space)+1rem)] lg:order-0 lg:self-start">
      <div className="border p-4">
        <p className="eyebrow">Evidence</p>
        <div className="mt-3">
          <EvidenceMeter value={c.evidence} segments={12} />
        </div>
        <p className="font-display mt-3 text-lg font-semibold">
          {c.verifiedFeatCount} of {c.featCount} feats verified
        </p>
        <p className="text-muted-foreground mt-1 text-sm">
          Only verified feats move the profile and the rank. Pending feats wait for
          community votes.
        </p>
      </div>

      {children}
    </aside>
  );
}
