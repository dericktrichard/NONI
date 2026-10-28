import Link from "next/link";
import { getSessionUser } from "@/lib/security/session";
import { hasRole, roleOf } from "@/lib/security/roles";

export default async function AdminHome() {
  const user = await getSessionUser();
  const role = user ? roleOf(user) : "user";
  const isAdmin = user ? hasRole(user, "admin") : false;

  return (
    <>
      <p className="eyebrow">Signed in as {role}</p>
      <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight">Admin</h1>
      <ul className="mt-8 divide-y border-y">
        {isAdmin ? (
          <>
            <li className="py-4">
              <Link href="/admin/characters" className="font-medium underline underline-offset-4">
                Characters
              </Link>
            </li>
            <li className="py-4">
              <Link href="/admin/characters/new" className="font-medium underline underline-offset-4">
                Add a character
              </Link>
            </li>
          </>
        ) : null}
        
        <li className="py-4">
          <Link href="/admin/moderation" className="font-medium underline underline-offset-4">
            Moderation queue
          </Link>
        </li>
      </ul>
    </>
  );
}