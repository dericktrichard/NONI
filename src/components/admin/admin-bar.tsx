"use client";

import Link from "next/link";
import { PublishButton } from "@/components/admin/publish-button";
import { useSession } from "@/hooks/use-session";

/** Admin shortcuts on a character page. The page stays cached, so the role is read in the browser. */
export function AdminBar({ slug, draft }: { slug: string; draft: boolean }) {
  const { state } = useSession();
  if (state.status !== "ready" || state.user?.role !== "admin") return null;

  return (
    <div className="mb-4 flex flex-wrap items-center gap-x-4 border-y">
      <span className="eyebrow">Admin</span>
      <Link
        href={`/admin/characters/${slug}/edit`}
        className="min-h-11 px-2 py-3 text-sm underline underline-offset-4"
      >
        Edit
      </Link>
      {draft ? <PublishButton slug={slug} /> : null}
      <Link
        href={`/admin/characters/${slug}/edit#danger`}
        className="min-h-11 px-2 py-3 text-sm underline underline-offset-4"
      >
        Delete
      </Link>
    </div>
  );
}
