import { ListQueueItem } from "@/components/admin/list-queue-item";
import type { ReportedList } from "@/lib/data/list-moderation";

export function ListModerationSection({ lists }: { lists: ReportedList[] }) {
  return (
    <section className="mt-10">
      <h2 className="eyebrow">Reported lists ({lists.length})</h2>
      {lists.length === 0 ? (
        <p className="mt-3 text-sm text-foreground/70">No open reports.</p>
      ) : (
        <ul>
          {lists.map((list) => (
            <li key={list.id} className="mt-4">
              <ListQueueItem list={list} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}