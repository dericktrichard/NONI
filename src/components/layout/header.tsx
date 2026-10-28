import Link from "next/link";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { AccountMenu } from "@/components/auth/account-menu";

export function Header() {
  return (
    <header className="pt-safe sticky top-0 z-40 border-b bg-background">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2" aria-label="NONI home">
          <span className="size-3 bg-accent" aria-hidden />
          <span className="font-display text-lg font-semibold tracking-tight">NONI</span>
        </Link>
        <Link href="/matchups" className="eyebrow ml-6 mr-auto px-1 py-3 hover:underline">
          Matchups
        </Link>
        <div className="flex items-center gap-2">
          <AccountMenu />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}