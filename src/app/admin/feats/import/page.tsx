import { notFound } from "next/navigation";
import { FeatImportForm } from "@/components/admin/feat-import-form";
import { hasRole } from "@/lib/security/roles";
import { getSessionUser } from "@/lib/security/session";

export default async function AdminFeatImportPage() {
  const user = await getSessionUser();
  if (!user || !hasRole(user, "admin")) notFound();

  return (
    <>
      <p className="eyebrow">Admin</p>
      <h1 className="font-display mt-2 text-4xl font-semibold tracking-tight">
        Import feats
      </h1>
      <p className="text-muted-foreground mt-3 max-w-2xl text-sm">
        Every feat arrives as pending, never verified. Voters and moderators confirm the
        proof before it counts toward a rank.
      </p>
      <FeatImportForm />
    </>
  );
}
