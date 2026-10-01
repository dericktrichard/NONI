import Image from "next/image";
import { cn } from "@/lib/utils";

type PortraitProps = {
  name: string;
  src: string | null;
  sizes: string;
  className?: string;
  priority?: boolean;
};

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  const first = parts[0] ?? "";
  if (parts.length === 1) return first.slice(0, 2).toUpperCase();
  return (first[0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Faces sit near the top of character art, so object-top keeps them in frame
 * when a tall image is cropped to 4:5. The parent must have the `group` class
 * for the hover zoom to work.
 */
export function Portrait({ name, src, sizes, className, priority }: PortraitProps) {
  return (
    <div
      className={cn("relative overflow-hidden bg-muted", className)}
      style={{ containerType: "inline-size" }}
    >
      {src ? (
        <Image
          src={src}
          alt={name}
          fill
          sizes={sizes}
          priority={priority}
          className="object-cover object-top transition-transform duration-300 group-hover:scale-[1.04]"
        />
      ) : (
        <div role="img" aria-label={name} className="absolute inset-0">
          <span
            className="absolute inset-0 grid select-none place-items-center font-display font-semibold tracking-tighter text-foreground/15"
            style={{ fontSize: "38cqw" }}
            aria-hidden
          >
            {initials(name)}
          </span>
          {/* Print-style crop marks */}
          <span className="absolute top-1.5 left-1.5 size-2 border-t border-l border-foreground/30" />
          <span className="absolute top-1.5 right-1.5 size-2 border-t border-r border-foreground/30" />
          <span className="absolute bottom-1.5 left-1.5 size-2 border-b border-l border-foreground/30" />
          <span className="absolute right-1.5 bottom-1.5 size-2 border-r border-b border-foreground/30" />
        </div>
      )}
    </div>
  );
}