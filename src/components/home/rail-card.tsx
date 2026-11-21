import Image from "next/image";
import Link from "next/link";
import { Portrait } from "@/components/characters/portrait";
import { RankMovement } from "@/components/characters/rank-movement";
import { TierBadge } from "@/components/characters/tier-badge";
import { cn, formatScore, pad2 } from "@/lib/utils";
import type { CharacterSummary } from "@/types/character";

export function RailCard({ c, position }: { c: CharacterSummary; position: number }) {
  return (
    <li className="w-36 shrink-0 snap-start sm:w-40 lg:w-44">
      <Link href={`/characters/${c.id}`} className="group block">
        <div className="relative">
          <Portrait
            name={c.name}
            src={c.imageUrl}
            sizes="176px"
            className="aspect-2/3 w-full"
          />
          <span
            className={cn(
              "font-display absolute top-0 left-0 px-2 py-1 text-sm font-semibold tabular-nums",
              position === 1
                ? "bg-accent text-accent-foreground"
                : "bg-foreground text-background",
            )}
          >
            {pad2(position)}
          </span>
          <span className="absolute top-2 right-2">
            <TierBadge tier={c.tier} />
          </span>
        </div>

        <span className="bg-accent block h-0.5 w-0 transition-[width] duration-200 group-hover:w-full" />

        <p className="font-display mt-2 truncate text-sm font-semibold underline-offset-4 group-hover:underline sm:text-base">
          {c.name}
        </p>
        <p className="eyebrow truncate">{c.verse}</p>
        <div className="mt-1 flex items-center justify-between">
          <span className="tabular text-sm font-semibold">{formatScore(c.score)}</span>
          <RankMovement trend={c.trend} />
        </div>
      </Link>
    </li>
  );
}

interface StackImage {
  src: string;
  name: string;
}

/** Back to front: the deeper the picture, the softer it is */
const BLUR = ["blur-sm", "blur-[3px]", "blur-[1.5px]", "blur-none"];

export function RailMore({
  href,
  label,
  images = [],
}: {
  href: string;
  label: string;
  images?: StackImage[];
}) {
  const stack = images.slice(0, 4);
  const spread = Math.max(stack.length - 1, 1);
  const last = stack[stack.length - 1];

  return (
    <li className="w-36 shrink-0 snap-start sm:w-40 lg:w-44">
      <Link
        href={href}
        className="group hover:border-foreground relative block aspect-2/3 w-full overflow-hidden border transition-colors"
      >
        {last ? (
          <div aria-hidden className="bg-muted absolute inset-0">
            <Image
              src={last.src}
              alt=""
              fill
              sizes="120px"
              className="scale-125 object-cover opacity-70 blur-2xl"
            />
            {stack.map((image, index) => (
              <div
                key={image.src}
                className="bg-muted absolute top-[6%] aspect-2/3 w-[58%] overflow-hidden border shadow-lg transition-transform duration-300 group-hover:-translate-y-1"
                style={{
                  left: `${(index / spread) * 38}%`,
                  transform: `rotate(${(index - (stack.length - 1) / 2) * 6}deg)`,
                  zIndex: index,
                }}
              >
                <Image
                  src={image.src}
                  alt=""
                  fill
                  sizes="120px"
                  className={cn(
                    "object-cover object-top",
                    BLUR[BLUR.length - stack.length + index],
                  )}
                />
              </div>
            ))}
          </div>
        ) : null}

        <div
          className={cn(
            "relative z-10 flex h-full flex-col justify-end p-3",
            stack.length > 0 && "pointer-events-none",
          )}
        >
          <div className="bg-background/85 -mx-3 -mb-3 p-3 backdrop-blur-md">
            <span className="eyebrow block">Browse</span>
            <span className="font-display mt-1 block text-xl leading-tight font-semibold">
              {label}
            </span>
            <span
              aria-hidden
              className="bg-foreground mt-3 block h-px w-6 transition-[width] duration-200 group-hover:w-14"
            />
          </div>
        </div>
      </Link>
    </li>
  );
}
