import { ImageQueueItem } from "@/components/admin/image-queue-item";
import type { ReportedImage } from "@/lib/data/image-moderation";

export function ImageModerationSection({ items }: { items: ReportedImage[] }) {
  return (
    <section className="mt-10">
      <h2 className="eyebrow">Reported images ({items.length})</h2>
      {items.length === 0 ? (
        <p className="text-foreground/70 mt-3 text-sm">No open reports.</p>
      ) : (
        <ul>
          {items.map((item) => (
            <li key={`${item.uid}/${item.kind}`} className="mt-4">
              <ImageQueueItem item={item} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
