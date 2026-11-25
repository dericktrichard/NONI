import { notFound } from "next/navigation";
import { AdminHeader } from "@/components/admin/admin-header";
import { CharacterForm } from "@/components/admin/character-form";
import { DeleteCharacter } from "@/components/admin/delete-character";
import { getCharacterForEdit } from "@/lib/data/admin-characters";
import { hasRole } from "@/lib/security/roles";
import { getSessionUser } from "@/lib/security/session";

export default async function EditCharacterPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const user = await getSessionUser();
  if (!user || !hasRole(user, "admin")) notFound();

  const { slug } = await params;
  const character = await getCharacterForEdit(slug);
  if (!character) notFound();

  return (
    <>
      <AdminHeader title={`Edit ${character.name}`} />
      <CharacterForm key={character.slug} initial={character} />
      <DeleteCharacter slug={character.slug} name={character.name} />
    </>
  );
}
