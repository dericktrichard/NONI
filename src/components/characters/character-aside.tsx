import { NewMatchupButton } from "@/components/matchups/matchup-actions";
import { ShareButton } from "@/components/share/share-button";
import type { CharacterView } from "@/types/character-page";
import { EvidenceMeter } from "./evidence-meter";
import { FavouriteButton } from "./favourite-button";

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

      <NewMatchupButton
        preset={{
          id: c.id,
          name: c.name,
          verse: c.verse,
          imageUrl: c.imageUrl,
          tier: c.tier,
        }}
        className="btn btn-solid h-auto w-full py-3 text-center whitespace-normal"
      >
        Compare with another character
      </NewMatchupButton>

      <FavouriteButton characterId={c.id} />

      <ShareButton
        title={`${c.name} on NONI`}
        text={`${c.name} is ranked ${c.rank ? `#${c.rank}` : "unranked"} on NONI.`}
        className="btn btn-quiet h-auto w-full py-3"
      />
      {children}
    </aside>
  );
}
