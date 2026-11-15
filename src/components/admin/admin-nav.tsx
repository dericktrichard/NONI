"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/admin", label: "Overview", admin: false },
  { href: "/admin/moderation", label: "Moderation", admin: false },
  { href: "/admin/characters", label: "Characters", admin: true },
  { href: "/admin/characters/new", label: "Add", admin: true },
  { href: "/admin/characters/import", label: "Import", admin: true },
] as const;

export function AdminNav({ admin }: { admin: boolean }) {
  const pathname = usePathname();
  const items = ITEMS.filter((item) => admin || !item.admin);
  const active = items
    .filter((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;

  return (
    <nav aria-label="Admin" className="-mx-4 mb-8 overflow-x-auto border-b px-4">
      <ul className="flex min-w-max gap-1">
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={item.href === active ? "page" : undefined}
              className={cn(
                "-mb-px flex min-h-11 items-center border-b-2 px-3 text-sm font-medium",
                item.href === active
                  ? "border-foreground"
                  : "text-muted-foreground hover:text-foreground border-transparent",
              )}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
