import Link from "next/link";
import { Portrait } from "@/components/characters/portrait";
import { TierBadge } from "@/components/characters/tier-badge";
import { versionLabel } from "@/lib/versions/rules";
import type { CharacterSummary } from "@/types/character";

export function OtherVersions({ versions }: { versions: CharacterSummary[] }) {
  if (versions.length === 0) return null;

  return (
    <section aria-labelledby="versions-title" className="mt-10">
      <h2 id="versions-title" className="eyebrow border-b pb-2">
        Other versions
      </h2>
      <ul className="divide-y border-b">
        {versions.map((v) => (
          <li key={v.id}>
            <Link
              href={`/characters/${v.id}`}
              className="hover:bg-muted flex items-center gap-3 py-3"
            >
              <Portrait
                name={v.name}
                src={v.imageUrl}
                sizes="40px"
                className="aspect-2/3 w-9 shrink-0"
              />
              <span className="min-w-0 flex-1">
                <span className="font-display block truncate text-base font-semibold">
                  {v.name}
                </span>
                <span className="eyebrow block truncate">
                  {versionLabel(v.media, v.continuity)}, {v.verse}
                </span>
              </span>
              <TierBadge tier={v.tier} />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
