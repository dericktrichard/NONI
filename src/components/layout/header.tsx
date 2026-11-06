"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AccountMenu } from "@/components/auth/account-menu";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/matchups", label: "Matchups", active: (path: string) => path.startsWith("/matchups"), hideOnPhone: false },
  { href: "/ranking", label: "Rankings", active: (path: string) => path.startsWith("/ranking"), hideOnPhone: true },
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
      <div ref={sentinel} aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-6" />
      <header className="pointer-events-none fixed inset-x-0 top-0 z-40 pt-[calc(0.75rem+env(safe-area-inset-top))]">
        <div className="mx-auto max-w-6xl px-4">
          <div
            data-scrolled={scrolled}
            className="acrylic pointer-events-auto flex h-(--nav-height) items-center rounded-sm px-4 transition-[background-color] duration-200"
          >
            <Link href="/" className="flex items-center gap-2" aria-label="NONI home">
              <span className="size-3 bg-accent" aria-hidden />
              <span className="font-display text-lg font-semibold tracking-tight">NONI</span>
            </Link>

            <nav aria-label="Primary" className="mr-auto ml-4 flex items-center">
              {LINKS.map((link) => {
                const active = link.active(pathname);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "eyebrow px-2 py-3 hover:underline",
                      link.hideOnPhone && "hidden sm:inline",
                      active && "underline decoration-accent decoration-2 underline-offset-10",
                    )}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            <div className="flex items-center gap-2">
              <AccountMenu />
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>
    </>
  );
}