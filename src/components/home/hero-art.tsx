"use client";

import Image from "next/image";
import { useDaypart } from "@/hooks/use-daypart";
import { cn } from "@/lib/utils";

export interface HeroSlide {
  id: string;
  src: string;
  position: string;
  credit: string | null;
}

export function HeroArt({ slides }: { slides: HeroSlide[] }) {
  const part = useDaypart();
  const active = Math.min(part, slides.length - 1);

  return (
    <>
      {slides.map((slide, index) => (
        <Image
          key={slide.id}
          src={slide.src}
          alt=""
          fill
          loading={index === 0 ? "eager" : "lazy"}
          fetchPriority={index === 0 ? "high" : "auto"}
          sizes="100vw"
          className={cn(
            "object-cover motion-safe:transition-opacity motion-safe:duration-700",
            index === active ? "opacity-100" : "opacity-0",
          )}
          style={{ objectPosition: slide.position }}
        />
      ))}
    </>
  );
}
