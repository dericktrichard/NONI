"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/admin", label: "Overview", exact: true, admin: false },
  { href: "/admin/moderation", label: "Moderation", exact: false, admin: false },
  { href: "/admin/characters", label: "Characters", exact: false, admin: true },
  { href: "/admin/import", label: "Import", exact: false, admin: true },
  { href: "/admin/notice", label: "Notice", exact: false, admin: true },
];

export function AdminNav({ admin }: { admin: boolean }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Admin" className="no-scrollbar overflow-x-auto border-b">
      <ul className="flex">
        {ITEMS.filter((item) => admin || !item.admin).map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "hover:bg-muted flex h-11 items-center border-b-2 border-transparent px-4 text-sm font-medium whitespace-nowrap transition-colors",
                  active && "border-b-accent",
                )}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
