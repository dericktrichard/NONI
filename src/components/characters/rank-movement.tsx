import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

export function RankMovement({ trend, className }: { trend: number; className?: string }) {
  if (trend === 0) {
    return (
      <span
        className={cn("inline-flex h-5 items-center text-muted-foreground", className)}
        aria-label="No change"
      >
        <Minus className="size-3" aria-hidden />
      </span>
    );
  }

  const up = trend > 0;
  const Icon = up ? ArrowUp : ArrowDown;

  return (
    <span
      className={cn(
        "tabular inline-flex h-5 items-center gap-0.5 rounded-sm px-1 text-xs font-medium",
        up ? "bg-accent text-accent-foreground" : "text-danger",
        className,
      )}
      aria-label={`${up ? "Up" : "Down"} ${Math.abs(trend)} places`}
    >
      <Icon className="size-3" strokeWidth={2.25} aria-hidden />
      {Math.abs(trend)}
    </span>
  );
}