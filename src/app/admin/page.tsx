import Link from "next/link";
import { getSessionUser } from "@/lib/security/session";
import { hasRole, roleOf } from "@/lib/security/roles";

interface Tile {
  href: string;
  eyebrow: string;
  title: string;
  text: string;
}

const ADMIN_TILES: Tile[] = [
  {
    href: "/admin/characters",
    eyebrow: "Catalogue",
    title: "Characters",
    text: "Browse and edit the roster.",
  },
  {
    href: "/admin/characters/new",
    eyebrow: "Catalogue",
    title: "Add a character",
    text: "Create a profile and upload its art.",
  },
];

const MOD_TILES: Tile[] = [
  {
    href: "/admin/moderation",
    eyebrow: "Review",
    title: "Moderation queue",
    text: "Feats, arguments and lists waiting for a decision.",
  },
];

function TileLink({ tile }: { tile: Tile }) {
  return (
    <li>
      <Link
        href={tile.href}
        className="hover:border-foreground hover:bg-muted block h-full border p-5 transition-colors"
      >
        <p className="eyebrow">{tile.eyebrow}</p>
        <p className="font-display mt-2 text-xl font-semibold">{tile.title}</p>
        <p className="text-muted-foreground mt-1 text-sm">{tile.text}</p>
      </Link>
    </li>
  );
}

export default async function AdminHome() {
  const user = await getSessionUser();
  const role = user ? roleOf(user) : "user";
  const isAdmin = user ? hasRole(user, "admin") : false;
  const tiles = isAdmin ? [...MOD_TILES, ...ADMIN_TILES] : MOD_TILES;

  return (
    <>
      <p className="eyebrow">Signed in as {role}</p>
      <h1 className="font-display mt-2 text-4xl font-semibold tracking-tight">Admin</h1>
      <ul className="mt-8 grid gap-3 sm:grid-cols-2">
        {tiles.map((tile) => (
          <TileLink key={tile.href} tile={tile} />
        ))}
      </ul>
    </>
  );
}
