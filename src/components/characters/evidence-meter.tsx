import { cn } from "@/lib/utils";

/** Segmented bar showing how well a ranking is backed by verified feats */
export function EvidenceMeter({
  value,
  segments = 8,
  className,
}: {
  value: number;
  segments?: number;
  className?: string;
}) {
  const filled = Math.round(value * segments);

  return (
    <div
      className={cn("flex gap-0.5", className)}
      role="img"
      aria-label={`Evidence strength ${filled} of ${segments}`}
    >
      {Array.from({ length: segments }, (_, i) => (
        <span
          key={i}
          className={cn("h-1.5 w-2 rounded-[1px]", i < filled ? "bg-foreground" : "bg-border")}
        />
      ))}
    </div>
  );
}