import { MARK_PATH } from "@/lib/brand/mark";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={cn("size-7 shrink-0", className)} aria-hidden>
      <rect width="64" height="64" className="fill-foreground" />
      <g transform="translate(12.7 9.7) scale(0.085)">
        <path d={MARK_PATH} className="fill-background" />
      </g>
      <rect x="52" y="6" width="5" height="5" className="fill-accent" />
    </svg>
  );
}
