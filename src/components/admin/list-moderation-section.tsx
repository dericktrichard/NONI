import { ListQueueItem } from "@/components/admin/list-queue-item";
import { SectionLabel } from "@/components/profile/section-label";
import type { ReportedList } from "@/lib/data/list-moderation";

export function ListModerationSection({ lists }: { lists: ReportedList[] }) {
  return (
    <section aria-label="Reported lists">
      <SectionLabel title="Reported lists" aside={`${lists.length} open`} />
      {lists.length === 0 ? (
        <p className="text-muted-foreground mt-4 border p-4 text-sm">No open reports.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {lists.map((list) => (
            <li key={list.id}>
              <ListQueueItem list={list} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
