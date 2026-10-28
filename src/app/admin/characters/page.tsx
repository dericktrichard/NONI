import Link from "next/link";
import { notFound } from "next/navigation";
import { TierBadge } from "@/components/characters/tier-badge";
import { buttonStyles } from "@/components/ui/button";
import { listCharacters } from "@/lib/data/admin-characters";
import { hasRole } from "@/lib/security/roles";
import { getSessionUser } from "@/lib/security/session";

export default async function AdminCharactersPage() {
  const user = await getSessionUser();
  if (!user || !hasRole(user, "admin")) notFound();

  const characters = await listCharacters();

  return (
    <>
      <p className="eyebrow">Admin</p>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-4xl font-semibold tracking-tight">Characters</h1>
        <Link href="/admin/characters/new" className={buttonStyles({ variant: "primary" })}>
          Add a character
        </Link>
      </div>
      <p className="eyebrow mt-3">{characters.length} total</p>

      <ul className="mt-6 divide-y border-y">
        {characters.map((character) => (
          <li key={character.slug} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
            <span className="eyebrow tabular w-10 shrink-0">{character.rank ?? "--"}</span>
            <div className="min-w-0 flex-1">
              <Link href={`/characters/${character.slug}`} className="font-medium underline underline-offset-4">
                {character.name}
              </Link>
              <p className="eyebrow truncate">
                {character.verse} / {character.verifiedFeatCount} of {character.featCount} feats verified
              </p>
            </div>
            <TierBadge tier={character.tier} />
            <Link href={`/admin/characters/${character.slug}/edit`} className="min-h-11 px-2 py-3 text-sm underline underline-offset-4">
              Edit
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}