"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useRef } from "react";

interface RailSectionProps {
  eyebrow: string;
  title: string;
  href?: string;
  children: React.ReactNode;
}

export function RailSection({ eyebrow, title, href, children }: RailSectionProps) {
  const track = useRef<HTMLUListElement>(null);

  function scrollBy(direction: 1 | -1) {
    const node = track.current;
    if (!node) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    node.scrollBy({
      left: direction * node.clientWidth * 0.85,
      behavior: reduce ? "auto" : "smooth",
    });
  }

  const arrow = "grid size-10 place-items-center transition-colors hover:bg-muted";

  return (
    <section className="pt-10" aria-label={title}>
      <div className="flex items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="eyebrow">{eyebrow}</p>
          <h2 className="font-display truncate text-2xl font-semibold tracking-tight sm:text-3xl">
            {title}
          </h2>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {href ? (
            <Link href={href} className="eyebrow px-1 py-3 hover:underline">
              View all
            </Link>
          ) : null}
          <div className="hidden border md:flex">
            <button
              type="button"
              aria-label={`Scroll ${title} left`}
              onClick={() => scrollBy(-1)}
              className={arrow}
            >
              <ChevronLeft className="size-5" strokeWidth={1.75} aria-hidden />
            </button>
            <button
              type="button"
              aria-label={`Scroll ${title} right`}
              onClick={() => scrollBy(1)}
              className={`${arrow} border-l`}
            >
              <ChevronRight className="size-5" strokeWidth={1.75} aria-hidden />
            </button>
          </div>
        </div>
      </div>

      <ul
        ref={track}
        className="no-scrollbar -mx-4 mt-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-2"
      >
        {children}
      </ul>
    </section>
  );
}
