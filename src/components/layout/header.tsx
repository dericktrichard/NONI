import Link from "next/link";
import { ThemeToggle } from "@/components/layout/theme-toggle";

export function Header() {
  return (
    <header className="pt-safe sticky top-0 z-40 border-b bg-background">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2" aria-label="NONI home">
          <span className="size-3 bg-accent" aria-hidden />
          <span className="text-lg font-semibold tracking-tight">NONI</span>
        </Link>
        <ThemeToggle />
      </div>
    </header>
  );
}