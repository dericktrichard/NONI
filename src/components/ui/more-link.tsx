import Link from "next/link";
import { cn } from "@/lib/utils";

interface MoreLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

export function MoreLink({ href, children, className }: MoreLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        "group inline-flex min-h-11 items-center gap-3 text-sm font-medium",
        className,
      )}
    >
      <span className="underline-offset-4 group-hover:underline">{children}</span>
      <span
        aria-hidden
        className="h-px w-6 bg-current transition-[width] duration-200 group-hover:w-10"
      />
    </Link>
  );
}
