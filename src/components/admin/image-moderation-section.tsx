import { ImageQueueItem } from "@/components/admin/image-queue-item";
import { SectionLabel } from "@/components/profile/section-label";
import type { ReportedImage } from "@/lib/data/image-moderation";

export function ImageModerationSection({ items }: { items: ReportedImage[] }) {
  return (
    <section aria-label="Reported images">
      <SectionLabel title="Reported images" aside={`${items.length} open`} />
      {items.length === 0 ? (
        <p className="text-muted-foreground mt-4 border p-4 text-sm">No open reports.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {items.map((item) => (
            <li key={`${item.uid}/${item.kind}`}>
              <ImageQueueItem item={item} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
