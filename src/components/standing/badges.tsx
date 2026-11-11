import Link from "next/link";
import { Portrait } from "@/components/characters/portrait";
import { SectionHeading } from "@/components/home/section-heading";
import { StandingToggle } from "@/components/standing/standing-toggle";
import type { Badge } from "@/lib/standing/types";
import { cn } from "@/lib/utils";

interface BadgesProps {
  badges: Badge[];
  isOwner: boolean;
  onBoards: boolean;
}

export function Badges({ badges, isOwner, onBoards }: BadgesProps) {
  if (badges.length === 0 && !isOwner) return null;

  return (
    <section className="mt-12">
      <SectionHeading
        title="Fan badges"
        aside={badges.length > 0 ? String(badges.length) : undefined}
      />

      {badges.length === 0 ? (
        <p className="text-muted-foreground mt-6 border p-4 text-sm">
          No badges yet. Battle with a character to start earning fan points.
        </p>
      ) : (
        <ul className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {badges.map((badge) => (
            <li key={badge.slug}>
              <Link
                href={`/characters/${badge.slug}`}
                className={cn(
                  "hover:border-foreground flex items-center gap-3 border p-2 transition-colors",
                  badge.rank === 1 && "border-foreground",
                )}
              >
                <Portrait
                  name={badge.name}
                  src={badge.imageUrl}
                  sizes="56px"
                  className="aspect-square w-12 shrink-0"
                />
                <span className="min-w-0">
                  <span className="flex items-center gap-1.5 text-sm font-medium">
                    {badge.rank === 1 ? (
                      <span className="bg-accent size-2 shrink-0" aria-hidden />
                    ) : null}
                    <span className="line-clamp-2">{badge.label}</span>
                  </span>
                  <span className="eyebrow tabular block">{badge.score} points</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {isOwner ? (
        <div className="mt-6 border p-4">
          {!onBoards && badges.length > 0 ? (
            <p className="text-muted-foreground mb-3 text-sm">
              Only you can see these until you switch on boards.
            </p>
          ) : null}
          <StandingToggle initial={onBoards} />
        </div>
      ) : null}
    </section>
  );
}
