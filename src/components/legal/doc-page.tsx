import Link from "next/link";
import { LEGAL } from "@/config/legal";

export interface DocSection {
  id: string;
  title: string;
  body: React.ReactNode;
}

interface DocPageProps {
  eyebrow: string;
  title: string;
  intro: string;
  sections: DocSection[];
  lead?: React.ReactNode;
  dated?: boolean;
}

const LINKS = [
  { href: "/about", label: "How it works" },
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy" },
  { href: "/content-policy", label: "Content policy" },
];

const nn = (index: number) => String(index + 1).padStart(2, "0");

export function DocPage({
  eyebrow,
  title,
  intro,
  sections,
  lead,
  dated = true,
}: DocPageProps) {
  return (
    <div className="mx-auto max-w-5xl px-4 pt-8 pb-24 sm:pt-12">
      <p className="eyebrow">{eyebrow}</p>
      <h1 className="font-display mt-2 text-4xl font-semibold tracking-tight sm:text-6xl">
        {title}
      </h1>
      <p className="text-muted-foreground mt-3 max-w-xl text-sm">{intro}</p>
      {dated ? <p className="eyebrow mt-4">Last updated {LEGAL.updated}</p> : null}
      {lead}

      <div className="mt-12 grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-12">
        <nav
          aria-label="On this page"
          className="min-w-0 lg:sticky lg:top-[calc(var(--nav-space)+1rem)] lg:self-start"
        >
          <ol className="flex gap-5 overflow-x-auto border-b lg:flex-col lg:gap-0 lg:border-b-0 lg:border-l">
            {sections.map((section, index) => (
              <li key={section.id} className="shrink-0">
                <a
                  href={`#${section.id}`}
                  className="tabular text-muted-foreground hover:text-foreground lg:hover:border-foreground flex items-baseline gap-2 py-2 text-xs transition-colors lg:-ml-px lg:border-l-2 lg:border-transparent lg:px-3"
                >
                  <span>{nn(index)}</span>
                  <span className="font-medium whitespace-nowrap">{section.title}</span>
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="min-w-0 divide-y border-y">
          {sections.map((section, index) => (
            <section
              key={section.id}
              id={section.id}
              className="grid scroll-mt-28 grid-cols-[minmax(0,1fr)] gap-2 py-8 sm:grid-cols-[3rem_minmax(0,1fr)] sm:gap-4"
            >
              <span className="eyebrow tabular">{nn(index)}</span>
              <div className="min-w-0">
                <h2 className="font-display text-2xl font-semibold tracking-tight">
                  {section.title}
                </h2>
                <div className="mt-3 max-w-prose space-y-3 text-sm leading-7 [&_a]:underline [&_a]:underline-offset-4 [&_li]:pl-1 [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5">
                  {section.body}
                </div>
              </div>
            </section>
          ))}
        </div>
      </div>

      <nav aria-label="Policies" className="mt-10 flex flex-wrap gap-x-5 gap-y-2 text-sm">
        {LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="underline-offset-4 hover:underline"
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
