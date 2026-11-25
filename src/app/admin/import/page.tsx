import { notFound } from "next/navigation";
import { AdminHeader } from "@/components/admin/admin-header";
import { ImportPanel } from "@/components/admin/import-panel";
import { hasRole } from "@/lib/security/roles";
import { getSessionUser } from "@/lib/security/session";

export default async function AdminImportPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const user = await getSessionUser();
  if (!user || !hasRole(user, "admin")) notFound();

  const { tab } = await searchParams;

  return (
    <>
      <AdminHeader
        title="Import"
        text="Add many characters or feats from a JSON file. Preview shows what would happen and writes nothing. Characters arrive as unranked drafts and feats arrive as pending, never verified."
      />
      <ImportPanel initial={tab === "feats" ? "feats" : "characters"} />
    </>
  );
}
