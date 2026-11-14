import Image from "next/image";
import type { CSSProperties } from "react";
import { Portrait } from "@/components/characters/portrait";
import type { FrameId } from "@/lib/flair/rules";
import type { BannerTheme, Look } from "@/lib/profile/look";
import { cn } from "@/lib/utils";

const THEME_STYLES: Record<BannerTheme, CSSProperties> = {
  plain: {},
  grid: {
    backgroundImage:
      "linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)",
    backgroundSize: "28px 28px",
  },
  stripes: {
    backgroundImage:
      "repeating-linear-gradient(135deg, currentColor 0 1px, transparent 1px 14px)",
  },
  dots: {
    backgroundImage: "radial-gradient(currentColor 1.5px, transparent 2px)",
    backgroundSize: "16px 16px",
  },
  bars: {
    backgroundImage:
      "repeating-linear-gradient(90deg, currentColor 0 6px, transparent 6px 12px)",
  },
  ink: {},
};

export function BannerSurface({
  theme,
  className,
  children,
}: {
  theme: BannerTheme;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      aria-hidden
      className={cn(
        "relative overflow-hidden border",
        theme === "ink" ? "bg-foreground" : "bg-muted text-foreground/15",
        className,
      )}
      style={THEME_STYLES[theme]}
    >
      {children}
    </div>
  );
}

export function ProfileBanner({
  look,
  className,
  sizes = "100vw",
}: {
  look: Look;
  className?: string;
  sizes?: string;
}) {
  return (
    <BannerSurface theme={look.bannerTheme} className={className}>
      {look.bannerUrl ? (
        <Image
          src={look.bannerUrl}
          alt=""
          fill
          loading="eager"
          sizes={sizes}
          className={cn(
            "object-cover",
            look.bannerId ? "object-[50%_15%]" : "object-center",
          )}
        />
      ) : null}
    </BannerSurface>
  );
}

/** Bought avatar frames. The decorations sit inside the avatar padding, so nothing overflows its container. */
const FRAME_STYLES: Record<FrameId, string> = {
  line: "border-foreground",
  double:
    "border-foreground before:pointer-events-none before:absolute before:inset-px before:z-10 before:border before:border-foreground/50",
  heavy: "border-2 border-foreground",
  mark: "border-foreground after:pointer-events-none after:absolute after:-top-px after:-left-px after:z-10 after:size-2 after:bg-accent",
};

export function ProfileAvatar({
  look,
  handle,
  className,
}: {
  look: Look;
  handle: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "bg-background relative shrink-0 border p-1",
        look.frame && FRAME_STYLES[look.frame],
        className,
      )}
    >
      {look.avatarUrl ? (
        <Portrait
          name={look.avatarName ?? handle}
          src={look.avatarUrl}
          sizes="112px"
          className="size-full"
        />
      ) : (
        <span
          aria-hidden
          className="bg-muted font-display grid size-full place-items-center text-3xl font-semibold uppercase"
        >
          {handle.slice(0, 1)}
        </span>
      )}
    </div>
  );
}
