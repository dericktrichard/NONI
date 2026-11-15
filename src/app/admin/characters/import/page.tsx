import { notFound } from "next/navigation";
import { ImportForm } from "@/components/admin/import-form";
import { hasRole } from "@/lib/security/roles";
import { getSessionUser } from "@/lib/security/session";

export default async function ImportCharactersPage() {
  const user = await getSessionUser();
  if (!user || !hasRole(user, "admin")) notFound();

  return (
    <>
      <p className="eyebrow">Admin</p>
      <h1 className="font-display mt-2 text-4xl font-semibold tracking-tight">
        Import characters
      </h1>
      <p className="text-muted-foreground mt-3 max-w-2xl text-sm">
        Up to 200 characters per file. Each one becomes an unranked draft, hidden from
        lists, search and battles, until it has enough verified feats and you publish it.
        Preview shows what would happen and writes nothing.
      </p>
      <ImportForm />
    </>
  );
}
