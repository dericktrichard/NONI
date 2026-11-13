import Link from "next/link";
import { Portrait } from "@/components/characters/portrait";
import { ListReportButton } from "@/components/lists/list-report-button";
import type { UserList } from "@/lib/data/lists";

export function ListItems({ list }: { list: UserList }) {
  return (
    <ol className="divide-y">
      {list.items.map((item, index) => (
        <li
          key={item.characterId}
          className="grid grid-cols-[2rem_2.5rem_1fr] items-start gap-3 p-4"
        >
          <span className="tabular font-display text-muted-foreground text-2xl leading-none font-semibold">
            {index + 1}
          </span>
          <Portrait
            name={item.name}
            src={item.imageUrl}
            sizes="40px"
            className="aspect-2/3 w-10 border"
          />
          <div className="min-w-0">
            <Link
              href={`/characters/${item.characterId}`}
              className="font-medium underline underline-offset-4"
            >
              {item.name}
            </Link>
            <p className="mt-1 text-sm whitespace-pre-line">{item.reason}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

export function ListCard({ list, isOwner }: { list: UserList; isOwner: boolean }) {
  return (
    <article className="border">
      <div className="bg-muted/50 flex flex-wrap items-center justify-between gap-3 border-b px-4">
        <h3 className="font-display py-3 text-xl font-semibold tracking-tight">
          {list.title}
        </h3>
        {isOwner ? (
          <span className="eyebrow">
            {list.visibility === "private" ? "Private, only you" : "Public"}
          </span>
        ) : (
          <ListReportButton listId={list.id} />
        )}
      </div>
      <ListItems list={list} />
    </article>
  );
}
