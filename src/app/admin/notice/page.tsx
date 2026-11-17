import { notFound } from "next/navigation";
import { NoticeForm } from "@/components/admin/notice-form";
import { getNoticeForEdit } from "@/lib/data/site-notice";
import { hasRole } from "@/lib/security/roles";
import { getSessionUser } from "@/lib/security/session";

export const dynamic = "force-dynamic";

export default async function AdminNoticePage() {
  const user = await getSessionUser();
  if (!user || !hasRole(user, "admin")) notFound();

  const initial = await getNoticeForEdit();

  return (
    <>
      <p className="eyebrow">Admin</p>
      <h1 className="font-display mt-2 text-4xl font-semibold tracking-tight">Notice</h1>
      <p className="text-muted-foreground mt-3 max-w-2xl text-sm">
        A short message at the top of the home page, below the navigation. Switched off,
        it does not exist for visitors.
      </p>
      <NoticeForm initial={initial} />
    </>
  );
}
