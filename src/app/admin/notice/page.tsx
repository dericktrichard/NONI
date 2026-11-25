import { notFound } from "next/navigation";
import { AdminHeader } from "@/components/admin/admin-header";
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
      <AdminHeader
        title="Notice"
        text="A short message at the top of the home page, below the navigation. Switched off, it does not exist for visitors."
      />
      <NoticeForm initial={initial} />
    </>
  );
}
