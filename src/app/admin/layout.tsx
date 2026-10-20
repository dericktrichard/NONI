import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSessionUser } from "@/lib/security/session";
import { hasRole } from "@/lib/security/roles";

export const metadata: Metadata = { title: "Admin | NONI", robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user || !hasRole(user, "moderator")) notFound();

  return <div className="mx-auto max-w-6xl px-4 pt-8 pb-24">{children}</div>;
}