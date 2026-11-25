import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminHeader } from "@/components/admin/admin-header";
import { CharacterTable } from "@/components/admin/character-table";
import { PublishAllButton } from "@/components/admin/publish-all-button";
import { listCharacters } from "@/lib/data/admin-characters";
import { hasRole } from "@/lib/security/roles";
import { getSessionUser } from "@/lib/security/session";

export default async function AdminCharactersPage() {
  const user = await getSessionUser();
  if (!user || !hasRole(user, "admin")) notFound();

  const characters = await listCharacters();

  return (
    <>
      <AdminHeader
        title="Characters"
        actions={
          <>
            <Link href="/admin/import" className="btn btn-line btn-sm">
              Import
            </Link>
            <Link href="/admin/characters/new" className="btn btn-solid btn-sm">
              Add a character
            </Link>
          </>
        }
      />
      <PublishAllButton count={characters.filter((c) => c.draft).length} />
      <div className="mt-6">
        <CharacterTable characters={characters} />
      </div>
    </>
  );
}
