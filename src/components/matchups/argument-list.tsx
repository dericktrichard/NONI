import Link from "next/link";
import type { ArgumentView } from "@/lib/data/matchup-page";

interface ArgumentListProps {
  items: ArgumentView[];
  names: { a: string; b: string };
}

export function ArgumentList({ items, names }: ArgumentListProps) {
  if (items.length === 0) {
    return <p className="mt-4 text-sm text-muted-foreground">No arguments yet. Be the first to make a case.</p>;
  }

  return (
    <ul className="mt-2 divide-y border-y">
      {items.map((item) => (
        <li key={item.id} className="py-5">
          <p className="eyebrow">
            Argues for {names[item.side]} / {item.authorName} / {item.createdAt.slice(0, 10)}
          </p>
          <p className="mt-2 text-sm whitespace-pre-line">{item.body}</p>
          <ul className="mt-3 space-y-1">
            {item.citations.map((citation) => (
              <li key={`${citation.characterId}/${citation.featId}`} className="text-sm">
                <span className="eyebrow mr-2">Cites</span>
                <Link href={`/characters/${citation.characterId}`} className="underline underline-offset-4">
                  {citation.title || citation.featId}
                </Link>
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ul>
  );
}