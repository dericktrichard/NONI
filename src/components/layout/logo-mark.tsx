import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={cn("size-7 shrink-0", className)} aria-hidden>
      <rect width="64" height="64" className="fill-foreground" />
      <path d="M16 48V16h7l18 20V16h7v32h-7L23 28v20z" className="fill-background" />
      <rect x="50" y="10" width="6" height="6" className="fill-accent" />
    </svg>
  );
}