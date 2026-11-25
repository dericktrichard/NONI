import Link from "next/link";
import { AdminHeader } from "@/components/admin/admin-header";
import { SectionLabel } from "@/components/profile/section-label";
import { getReportedImages } from "@/lib/data/image-moderation";
import { getReportedLists } from "@/lib/data/list-moderation";
import { fetchModQueue } from "@/lib/data/mod-queue";
import { fetchSiteStats } from "@/lib/data/site-stats";
import { hasRole, roleOf } from "@/lib/security/roles";
import { getSessionUser } from "@/lib/security/session";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

function Count({
  href,
  label,
  value,
  className,
}: {
  href: string;
  label: string;
  value: number;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn("bg-background hover:bg-muted block p-4 transition-colors", className)}
    >
      <p className="eyebrow flex items-center gap-2">
        {value > 0 ? <span className="bg-accent size-1.5" aria-hidden /> : null}
        {label}
      </p>
      <p className="tabular font-display mt-1 text-3xl font-semibold">{value}</p>
    </Link>
  );
}

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="px-4 py-3">
      <dt className="eyebrow">{label}</dt>
      <dd className="tabular font-display text-2xl font-semibold">{children}</dd>
    </div>
  );
}

export default async function AdminHome() {
  const user = await getSessionUser();
  const role = user ? roleOf(user) : "user";
  const isAdmin = user ? hasRole(user, "admin") : false;

  const [stats, queue, lists, images] = await Promise.all([
    fetchSiteStats(),
    fetchModQueue(),
    getReportedLists(),
    getReportedImages(),
  ]);

  const open =
    queue.reported.length + queue.reportedArguments.length + lists.length + images.length;
  const counts: [string, number | null][] = [
    ["Characters", stats.characters],
    ["Verified feats", stats.verifiedFeats],
    ["Matchups", stats.matchups],
  ];

  return (
    <>
      <AdminHeader
        title="Overview"
        text={
          open === 0
            ? `Signed in as ${role}. Nothing needs a decision right now.`
            : `Signed in as ${role}. ${open} ${open === 1 ? "report is" : "reports are"} open.`
        }
        actions={
          isAdmin ? (
            <>
              <Link href="/admin/import" className="btn btn-line btn-sm">
                Import
              </Link>
              <Link href="/admin/characters/new" className="btn btn-solid btn-sm">
                Add a character
              </Link>
            </>
          ) : null
        }
      />

      <section aria-label="Needs attention">
        <SectionLabel title="Needs attention" aside={`${open} open`} />
        <div className="bg-border mt-4 grid grid-cols-2 gap-px border sm:grid-cols-5">
          <Count
            href="/admin/moderation?tab=feats"
            label="Feat reports"
            value={queue.reported.length}
          />
          <Count
            href="/admin/moderation?tab=arguments"
            label="Arguments"
            value={queue.reportedArguments.length}
          />
          <Count href="/admin/moderation?tab=lists" label="Lists" value={lists.length} />
          <Count href="/admin/moderation?tab=images" label="Images" value={images.length} />
          <Count
            href="/admin/moderation?tab=pending"
            label="Pending feats"
            value={queue.pending.length}
            className="col-span-2 sm:col-span-1"
          />
        </div>
      </section>

      <section className="mt-10" aria-label="Site">
        <SectionLabel title="The site" />
        <dl className="mt-4 grid grid-cols-3 divide-x border">
          {counts.map(([label, value]) => (
            <Stat key={label} label={label}>
              {value === null ? "-" : value.toLocaleString("en-US")}
            </Stat>
          ))}
        </dl>
      </section>

      {isAdmin ? (
        <section className="mt-10" aria-label="Shortcuts">
          <SectionLabel title="Shortcuts" />
          <ul className="mt-4 grid gap-3 sm:grid-cols-3">
            {[
              {
                href: "/admin/characters",
                title: "Characters",
                text: "Browse, edit, publish drafts and delete.",
              },
              {
                href: "/admin/import",
                title: "Import",
                text: "Characters or feats from a JSON file.",
              },
              {
                href: "/admin/notice",
                title: "Notice",
                text: "The message under the home navigation.",
              },
            ].map((tile) => (
              <li key={tile.href}>
                <Link
                  href={tile.href}
                  className="hover:border-foreground hover:bg-muted block h-full border p-4 transition-colors"
                >
                  <p className="font-display text-lg font-semibold">{tile.title}</p>
                  <p className="text-muted-foreground mt-1 text-sm">{tile.text}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </>
  );
}
