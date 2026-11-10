"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { NAV_KEY } from "@/components/layout/nav-tracker";

interface Crumb {
  label: string;
  href?: string;
}

interface PageTopProps {
  back: { href: string; label: string };
  trail?: Crumb[];
}

export function PageTop({ back, trail = [] }: PageTopProps) {
  const router = useRouter();

  function goBack(event: React.MouseEvent) {
    let visited = 0;
    try {
      visited = Number(sessionStorage.getItem(NAV_KEY)) || 0;
    } catch {
      /* storage can be blocked */
    }
    if (visited > 1 && window.history.length > 1) {
      event.preventDefault();
      router.back();
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 pb-4">
      <Link
        href={back.href}
        onClick={goBack}
        className="group inline-flex min-h-11 items-center gap-2 text-sm font-medium"
      >
        <ArrowLeft
          className="size-4 transition-transform duration-200 group-hover:-translate-x-1"
          strokeWidth={1.75}
          aria-hidden
        />
        <span className="underline-offset-4 group-hover:underline">{back.label}</span>
      </Link>

      {trail.length > 0 ? (
        <nav aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-2">
            {trail.map((crumb, index) => (
              <li
                key={`${crumb.label}-${index}`}
                className="eyebrow flex items-center gap-2"
              >
                {index > 0 ? <span aria-hidden>/</span> : null}
                {crumb.href ? (
                  <Link
                    href={crumb.href}
                    className="hover:text-foreground hover:underline"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span aria-current="page" className="text-foreground">
                    {crumb.label}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      ) : null}
    </div>
  );
}
