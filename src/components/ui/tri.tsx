import { cn } from "@/lib/utils";

export function Tri({ dir, className }: { dir: "up" | "down"; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "block size-2.5 bg-current",
        dir === "up"
          ? "[clip-path:polygon(50%_0,100%_100%,0_100%)]"
          : "[clip-path:polygon(0_0,100%_0,50%_100%)]",
        className,
      )}
    />
  );
}
