import Link from "next/link";
import { Portrait } from "@/components/characters/portrait";
import { TierBadge } from "@/components/characters/tier-badge";
import { SectionHeading } from "@/components/home/section-heading";
import { dimensionLabel } from "@/config/scales";
import { kindText, tierText } from "@/lib/feats/labels";
import type { MatchupPageData, MatchupSideView } from "@/lib/data/matchup-page";
import { favorsText, percentA, verdictText } from "@/lib/matchup/labels";
import type { HaxClaim } from "@/lib/ranking/profile";
import { cn } from "@/lib/utils";
import { CommunityVote } from "@/components/matchups/community-vote";
import { ArgumentForm } from "@/components/matchups/argument-form";
import { ArgumentList } from "@/components/matchups/argument-list";

function Side({ side, flip }: { side: MatchupSideView; flip?: boolean }) {
  return (
    <Link
      href={`/characters/${side.slug}`}
      className={cn(
        "group flex min-w-0 items-center gap-3 p-3 sm:gap-4 sm:p-4",
        flip && "sm:flex-row-reverse sm:text-right",
      )}
    >
      <Portrait
        name={side.name}
        src={side.imageUrl}
        sizes="112px"
        className="aspect-2/3 w-16 shrink-0 sm:w-24"
      />
      <div className="min-w-0 flex-1">
        <p className="eyebrow truncate">{side.verse}</p>
        <p className="font-display text-xl leading-tight font-semibold underline-offset-4 group-hover:underline sm:text-2xl">
          {side.name}
        </p>
        <div
          className={cn(
            "mt-2 flex flex-wrap items-center gap-2",
            flip && "sm:justify-end",
          )}
        >
          <TierBadge tier={side.tier} />
          <span className="eyebrow">{side.rank ? `Rank ${side.rank}` : "Unranked"}</span>
        </div>
      </div>
    </Link>
  );
}

function ProbabilityBar({ a, b, percent }: { a: string; b: string; percent: number }) {
  const other = 100 - percent;

  return (
    <div>
      <div className="font-display tabular flex items-baseline justify-between text-4xl font-semibold sm:text-6xl">
        <span>{percent}%</span>
        <span>{other}%</span>
      </div>
      <div
        role="img"
        aria-label={`${a} ${percent} percent, ${b} ${other} percent`}
        className="mt-3 flex h-3 border"
      >
        <div className="bg-foreground" style={{ width: `${percent}%` }} />
        <div className="bg-accent flex-1" />
      </div>
      <div className="mt-2 flex justify-between gap-4">
        <span className="eyebrow truncate">{a}</span>
        <span className="eyebrow truncate text-right">{b}</span>
      </div>
    </div>
  );
}

function Abilities({ claims }: { claims: HaxClaim[] }) {
  if (claims.length === 0) return <span className="text-muted-foreground">None</span>;
  return (
    <ul className="space-y-1">
      {claims.map((claim) => (
        <li key={claim.kind}>
          {kindText(claim.kind)}{" "}
          <span className="text-muted-foreground">{tierText(claim.power)}</span>
        </li>
      ))}
    </ul>
  );
}

const ROW_GRID = "grid grid-cols-2 gap-x-4 sm:grid-cols-[1fr_9rem_1fr] sm:gap-x-6";

function Row({ label, a, b }: { label: string; a: React.ReactNode; b: React.ReactNode }) {
  return (
    <div className={cn(ROW_GRID, "border-b py-4")}>
      <dt className="eyebrow col-span-2 mb-1 sm:order-2 sm:col-span-1 sm:mb-0 sm:pt-0.5 sm:text-center">
        {label}
      </dt>
      <dd className="min-w-0 text-sm font-medium sm:order-1">{a}</dd>
      <dd className="min-w-0 text-sm font-medium sm:order-3 sm:text-right">{b}</dd>
    </div>
  );
}

export function MatchupView({ data }: { data: MatchupPageData }) {
  const { a, b, result } = data;
  const names = { a: a.name, b: b.name };
  const percent = percentA(result.probabilityA);
  const baseline = [a, b].filter((side) => side.verifiedFeatCount === 0);

  return (
    <article>
      <p className="eyebrow">Matchup</p>
      <h1 className="font-display mt-2 text-3xl leading-tight font-semibold tracking-tight sm:text-5xl">
        {a.name} vs {b.name}
      </h1>

      <div className="mt-6 grid border sm:grid-cols-[1fr_auto_1fr]">
        <Side side={a} />
        <span
          className="bg-muted font-display text-muted-foreground grid h-9 place-items-center border-y text-sm font-semibold sm:h-auto sm:w-14 sm:border-x sm:border-y-0"
          aria-hidden
        >
          VS
        </span>
        <Side side={b} flip />
      </div>

      <section className="mt-12" aria-label="Verdict">
        <SectionHeading index="01" title="Verdict" />
        <div className="mt-6 border p-4 sm:p-6">
          <p className="font-display text-2xl font-semibold sm:text-3xl">
            {verdictText(result, names)}
          </p>
          <div className="mt-6">
            <ProbabilityBar a={a.name} b={b.name} percent={percent} />
          </div>
          <div className="mt-5">
            <Link href={`/matchups/${b.slug}/${a.slug}`} className="btn btn-line btn-sm">
              Swap sides
            </Link>
          </div>
        </div>
      </section>

      <section className="mt-12" aria-label="Community vote">
        <SectionHeading index="02" title="Community vote" />
        <p className="text-muted-foreground mt-3 text-sm">
          Who do you think wins? Voting needs a verified account. It does not change the
          verdict above.
        </p>
        <div className="mt-4">
          <CommunityVote
            a={{ slug: a.slug, name: a.name }}
            b={{ slug: b.slug, name: b.name }}
            initial={data.community}
          />
        </div>
      </section>

      <section className="mt-12" aria-label="Side by side">
        <SectionHeading index="03" title="Side by side" />
        <div className={cn(ROW_GRID, "mt-6 border-b pb-2")}>
          <p className="eyebrow truncate">{a.name}</p>
          <span className="hidden sm:block" aria-hidden />
          <p className="eyebrow truncate sm:text-right">{b.name}</p>
        </div>
        <dl>
          <Row
            label="Attack potency"
            a={tierText(a.attackPotency)}
            b={tierText(b.attackPotency)}
          />
          <Row label="Durability" a={tierText(a.durability)} b={tierText(b.durability)} />
          <Row label="Speed" a={a.speed} b={b.speed} />
          <Row
            label="Dimensionality"
            a={dimensionLabel(a.dimension)}
            b={dimensionLabel(b.dimension)}
          />
          <Row
            label="Abilities"
            a={<Abilities claims={a.hax} />}
            b={<Abilities claims={b.hax} />}
          />
          <Row
            label="Resistances"
            a={<Abilities claims={a.resistances} />}
            b={<Abilities claims={b.resistances} />}
          />
          <Row
            label="Verified feats"
            a={`${a.verifiedFeatCount} of ${a.featCount}`}
            b={`${b.verifiedFeatCount} of ${b.featCount}`}
          />
        </dl>
      </section>

      <section className="mt-12" aria-label="Why">
        <SectionHeading index="04" title="Why" />
        <ul className="mt-6 space-y-3">
          {result.reasons.map((reason, index) => (
            <li key={index} className="border p-4">
              <p className="eyebrow">{favorsText(reason.favors, names)}</p>
              <p className="mt-1 text-sm">{reason.note}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-12" aria-label="Arguments">
        <SectionHeading index="05" title="Arguments" />
        <ArgumentList
          items={data.arguments}
          names={names}
          slugs={{ a: a.slug, b: b.slug }}
        />
        <ArgumentForm
          a={{ slug: a.slug, name: a.name }}
          b={{ slug: b.slug, name: b.name }}
          citable={data.citable}
        />
      </section>

      <p className="text-muted-foreground mt-10 text-sm">
        The verdict comes from fixed rules applied to each character&apos;s profile. It is
        not an opinion and it changes only when a feat is verified.
        {baseline.length > 0
          ? ` ${baseline.map((side) => side.name).join(" and ")} ${baseline.length > 1 ? "have" : "has"} no verified feats yet, so ${baseline.length > 1 ? "their profiles use" : "the profile uses"} the starting baseline.`
          : ""}
      </p>
    </article>
  );
}
