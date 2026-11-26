import Link from "next/link";
import { AdminHeader } from "@/components/admin/admin-header";
import { ArgumentQueueItem } from "@/components/admin/argument-queue-item";
import { ImageModerationSection } from "@/components/admin/image-moderation-section";
import { ListModerationSection } from "@/components/admin/list-moderation-section";
import { QueueItem } from "@/components/admin/queue-item";
import { SectionLabel } from "@/components/profile/section-label";
import { getReportedImages } from "@/lib/data/image-moderation";
import { getReportedLists } from "@/lib/data/list-moderation";
import { fetchModQueue } from "@/lib/data/mod-queue";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Tab = "feats" | "arguments" | "lists" | "images" | "pending";

function Empty({ text }: { text: string }) {
  return <p className="text-muted-foreground mt-4 border p-4 text-sm">{text}</p>;
}

export default async function ModerationPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab: raw } = await searchParams;
  const [{ reported, pending, reportedArguments }, reportedLists, reportedImages] =
    await Promise.all([fetchModQueue(), getReportedLists(), getReportedImages()]);

  const tabs: Array<{ key: Tab; label: string; count: number }> = [
    { key: "feats", label: "Feats", count: reported.length },
    { key: "arguments", label: "Arguments", count: reportedArguments.length },
    { key: "lists", label: "Lists", count: reportedLists.length },
    { key: "images", label: "Images", count: reportedImages.length },
    { key: "pending", label: "Pending", count: pending.length },
  ];
  const tab: Tab = tabs.some((item) => item.key === raw) ? (raw as Tab) : "feats";

  return (
    <>
      <AdminHeader
        title="Moderation"
        text="Reports and feats waiting for a decision. Each tab shows how many are open."
      />

      <div role="group" aria-label="Queue" className="no-scrollbar flex overflow-x-auto border-b">
        {tabs.map((item) => (
          <Link
            key={item.key}
            href={`/admin/moderation?tab=${item.key}`}
            aria-current={tab === item.key ? "page" : undefined}
            className={cn(
              "hover:bg-muted flex h-11 items-center gap-2 border-b-2 border-transparent px-4 text-sm font-medium whitespace-nowrap transition-colors",
              tab === item.key && "border-b-accent",
            )}
          >
            {item.label}
            <span
              className={cn(
                "tabular text-xs",
                item.count > 0 ? "text-foreground font-semibold" : "text-muted-foreground",
              )}
            >
              {item.count}
            </span>
          </Link>
        ))}
      </div>

      <section className="mt-6" aria-label={tab}>
        {tab === "feats" ? (
          <>
            <SectionLabel title="Reported feats" aside={`${reported.length} open`} />
            {reported.length === 0 ? (
              <Empty text="No open reports." />
            ) : (
              <ul className="mt-4 space-y-3">
                {reported.map((feat) => (
                  <QueueItem key={feat.id} feat={feat} />
                ))}
              </ul>
            )}
          </>
        ) : null}

        {tab === "arguments" ? (
          <>
            <SectionLabel
              title="Reported arguments"
              aside={`${reportedArguments.length} open`}
            />
            {reportedArguments.length === 0 ? (
              <Empty text="No open reports." />
            ) : (
              <ul className="mt-4 space-y-3">
                {reportedArguments.map((item) => (
                  <ArgumentQueueItem
                    key={`${item.a}/${item.b}/${item.argumentId}`}
                    item={item}
                  />
                ))}
              </ul>
            )}
          </>
        ) : null}

        {tab === "lists" ? <ListModerationSection lists={reportedLists} /> : null}

        {tab === "images" ? <ImageModerationSection items={reportedImages} /> : null}

        {tab === "pending" ? (
          <>
            <SectionLabel
              title="Pending feats, highest score first"
              aside={`${pending.length} waiting`}
            />
            {pending.length === 0 ? (
              <Empty text="Nothing waiting." />
            ) : (
              <ul className="mt-4 space-y-3">
                {pending.map((feat) => (
                  <QueueItem key={feat.id} feat={feat} />
                ))}
              </ul>
            )}
          </>
        ) : null}
      </section>
    </>
  );
}
