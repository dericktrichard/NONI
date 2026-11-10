import Link from "next/link";
import { LogoMark } from "@/components/layout/logo-mark";

export function Footer() {
  return (
    <footer className="mt-16 border-t">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-sm">
          <div className="flex items-center gap-2">
            <LogoMark className="size-6" />
            <span className="font-display text-lg font-semibold tracking-tight">
              NONI
            </span>
          </div>
          <p className="text-muted-foreground mt-3 text-sm">
            Fictional powerscaling backed by cited evidence. Rankings come from verified
            feats and fixed rules, not opinion.
          </p>
        </div>

        <nav aria-label="Footer" className="flex gap-6 text-sm">
          <Link href="/" className="underline-offset-4 hover:underline">
            Explore
          </Link>
          <Link href="/matchups" className="underline-offset-4 hover:underline">
            Matchups
          </Link>
          <Link href="/play" className="underline-offset-4 hover:underline">
            Play
          </Link>
        </nav>
      </div>
    </footer>
  );
}
