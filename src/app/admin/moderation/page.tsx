import { QueueItem } from "@/components/admin/queue-item";
import { fetchModQueue } from "@/lib/data/mod-queue";

export const dynamic = "force-dynamic";

export default async function ModerationPage() {
  const { reported, pending } = await fetchModQueue();

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <h1 className="font-display text-2xl font-semibold">Moderation</h1>

      <section className="mt-8">
        <h2 className="eyebrow">Reported ({reported.length})</h2>
        {reported.length === 0 ? (
          <p className="mt-3 text-sm text-foreground/70">No open reports.</p>
        ) : (
          <ul>
            {reported.map((feat) => (
              <QueueItem key={feat.id} feat={feat} />
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10">
        <h2 className="eyebrow">Pending, highest score first ({pending.length})</h2>
        {pending.length === 0 ? (
          <p className="mt-3 text-sm text-foreground/70">Nothing waiting.</p>
        ) : (
          <ul>
            {pending.map((feat) => (
              <QueueItem key={feat.id} feat={feat} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}