import Link from "next/link";
import { LogoMark } from "@/components/layout/logo-mark";

const GROUPS = [
  {
    title: "Explore",
    links: [
      { href: "/", label: "Rankings" },
      { href: "/matchups", label: "Matchups" },
      { href: "/leaderboard", label: "Leaderboard" },
    ],
  },
  {
    title: "Play",
    links: [
      { href: "/play", label: "Higher or lower" },
      { href: "/battle", label: "Battle" },
    ],
  },
  {
    title: "About",
    links: [
      { href: "/about", label: "How it works" },
      { href: "/terms", label: "Terms" },
      { href: "/privacy", label: "Privacy" },
      { href: "/content-policy", label: "Content policy" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-16 border-t">
      <div className="mx-auto max-w-6xl px-4 pt-10 pb-24 sm:pb-10">
        <div className="bg-border grid grid-cols-1 gap-px border sm:grid-cols-3 lg:grid-cols-[1.6fr_1fr_1fr_1fr]">
          <div className="bg-background p-5 sm:col-span-3 lg:col-span-1">
            <div className="flex items-center gap-2">
              <LogoMark className="size-6" />
              <span className="font-display text-lg font-semibold tracking-tight">
                NONI
              </span>
            </div>
            <p className="text-muted-foreground mt-3 max-w-xs text-sm">
              Fictional powerscaling backed by cited evidence. Rankings come from verified
              feats and fixed rules, not opinion.
            </p>
          </div>

          {GROUPS.map((group) => (
            <nav key={group.title} aria-label={group.title} className="bg-background p-5">
              <p className="eyebrow">{group.title}</p>
              <ul className="mt-3 space-y-2 text-sm">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="underline-offset-4 hover:underline">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="text-muted-foreground mt-5 flex flex-wrap items-center justify-between gap-x-6 gap-y-2 text-xs">
          <p>
            An independent fan project. Not affiliated with any creator or rights holder.
          </p>
          <p className="eyebrow flex items-center gap-2">
            <span className="bg-accent size-1.5" aria-hidden />
            Beta
          </p>
        </div>
      </div>
    </footer>
  );
}
