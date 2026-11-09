"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/play", label: "Higher or lower" },
  { href: "/matchups", label: "Matchups" },
];

export function SectionTabs() {
  const pathname = usePathname();
  return (
    <nav aria-label="Play sections" className="flex border-b">
      {TABS.map(({ href, label }) => {
        const active = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex h-11 items-center border-b-2 border-transparent px-4 text-sm font-medium transition-colors hover:bg-muted sm:px-5",
              active && "border-b-accent",
            )}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}