import { notFound } from "next/navigation";
import { CharacterForm } from "@/components/admin/character-form";
import { getCharacterForEdit } from "@/lib/data/admin-characters";
import { hasRole } from "@/lib/security/roles";
import { getSessionUser } from "@/lib/security/session";
import { DeleteCharacter } from "@/components/admin/delete-character";

export default async function EditCharacterPage({ params }: { params: Promise<{ slug: string }> }) {
  const user = await getSessionUser();
  if (!user || !hasRole(user, "admin")) notFound();

  const { slug } = await params;
  const character = await getCharacterForEdit(slug);
  if (!character) notFound();

  return (
    <>
      <p className="eyebrow">Admin</p>
      <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight">Edit {character.name}</h1>
      <CharacterForm key={character.slug} initial={character} />
      <DeleteCharacter slug={character.slug} name={character.name} />
    </>
  );
}