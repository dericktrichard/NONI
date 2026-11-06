"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AccountButton } from "@/components/auth/account-button";
import { AuthHost } from "@/components/auth/auth-host";
import { GlobalSearch } from "@/components/layout/global-search";
import { LogoMark } from "@/components/layout/logo-mark";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { cn } from "@/lib/utils";

const LINKS = [
  {
    href: "/",
    label: "Explore",
    match: (path: string) => path === "/" || path.startsWith("/ranking") || path.startsWith("/characters"),
  },
  { href: "/matchups", label: "Matchups", match: (path: string) => path.startsWith("/matchups") },
];

export function Header() {
  const pathname = usePathname();
  const sentinel = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const node = sentinel.current;
    if (!node) return;
    const observer = new IntersectionObserver((entries) => {
      const entry = entries[0];
      if (entry) setScrolled(!entry.isIntersecting);
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <AuthHost />
      <div ref={sentinel} aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-6" />
      <header className="pointer-events-none fixed inset-x-0 top-0 z-40 pt-[calc(0.75rem+env(safe-area-inset-top))]">
        <div className="mx-auto max-w-6xl px-4">
          <div
            data-scrolled={scrolled}
            className="acrylic pointer-events-auto flex h-(--nav-height) items-center px-4 transition-[background-color] duration-200"
          >
            <Link href="/" className="flex items-center gap-2" aria-label="NONI home">
              <LogoMark className="size-7" />
              <span className="font-display text-lg font-semibold tracking-tight">NONI</span>
            </Link>

            <nav aria-label="Primary" className="mr-auto ml-4 hidden items-center sm:flex">
              {LINKS.map((link) => {
                const active = link.match(pathname);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "eyebrow px-2 py-3 hover:underline",
                      active && "text-foreground underline decoration-accent decoration-2 underline-offset-10",
                    )}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            <div className="ml-auto flex items-center gap-2 sm:ml-0">
              <ThemeToggle />
              <GlobalSearch />
              <div className="hidden sm:block">
                <AccountButton />
              </div>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}