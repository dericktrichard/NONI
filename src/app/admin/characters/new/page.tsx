import { notFound } from "next/navigation";
import { CharacterForm } from "@/components/admin/character-form";
import { hasRole } from "@/lib/security/roles";
import { getSessionUser } from "@/lib/security/session";

export default async function NewCharacterPage() {
  const user = await getSessionUser();
  if (!user || !hasRole(user, "admin")) notFound();

  return (
    <>
      <p className="eyebrow">Admin</p>
      <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight">Add a character</h1>
      <CharacterForm />
    </>
  );
}