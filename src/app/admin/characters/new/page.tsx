import { notFound } from "next/navigation";
import { AdminHeader } from "@/components/admin/admin-header";
import { CharacterForm } from "@/components/admin/character-form";
import { hasRole } from "@/lib/security/roles";
import { getSessionUser } from "@/lib/security/session";

export default async function NewCharacterPage() {
  const user = await getSessionUser();
  if (!user || !hasRole(user, "admin")) notFound();

  return (
    <>
      <AdminHeader title="Add a character" />
      <CharacterForm />
    </>
  );
}
