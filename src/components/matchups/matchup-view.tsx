import Link from "next/link";
import { Portrait } from "@/components/characters/portrait";
import { TierBadge } from "@/components/characters/tier-badge";
import { dimensionLabel } from "@/config/scales";
import { kindText, tierText } from "@/lib/feats/labels";
import type { MatchupPageData, MatchupSideView } from "@/lib/data/matchup-page";
import { favorsText, percentA, verdictText } from "@/lib/matchup/labels";
import type { HaxClaim } from "@/lib/ranking/profile";
import { CommunityVote } from "@/components/matchups/community-vote";

function SideHeader({ side }: { side: MatchupSideView }) {
  return (
    <Link href={`/characters/${side.slug}`} className="group block min-w-0">
      <Portrait
        name={side.name}
        src={side.imageUrl}
        sizes="(min-width: 640px) 280px, 45vw"
        className="aspect-4/5 w-full"
      />
      <p className="eyebrow mt-2 truncate">{side.verse}</p>
      <p className="font-display text-xl leading-tight font-semibold sm:text-3xl">{side.name}</p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <TierBadge tier={side.tier} />
        <span className="eyebrow">{side.rank ? `Rank ${side.rank}` : "Unranked"}</span>
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
      <div role="img" aria-label={`${a} ${percent} percent, ${b} ${other} percent`} className="mt-3 flex h-3 border">
        <div className="bg-foreground" style={{ width: `${percent}%` }} />
        <div className="flex-1 bg-accent" />
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
          {kindText(claim.kind)} <span className="text-muted-foreground">{tierText(claim.power)}</span>
        </li>
      ))}
    </ul>
  );
}

function Row({ label, a, b }: { label: string; a: React.ReactNode; b: React.ReactNode }) {
  return (
    <div className="border-b py-4">
      <dt className="eyebrow">{label}</dt>
      <dd className="mt-1 grid grid-cols-2 gap-4 text-sm font-medium">
        <div className="min-w-0">{a}</div>
        <div className="min-w-0">{b}</div>
      </dd>
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
      <h1 className="mt-2 font-display text-3xl leading-tight font-semibold tracking-tight sm:text-5xl">
        {a.name} vs {b.name}
      </h1>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:gap-10">
        <SideHeader side={a} />
        <SideHeader side={b} />
      </div>

      <section className="mt-10 border-y py-8" aria-labelledby="verdict">
        <h2 id="verdict" className="eyebrow">
          Verdict
        </h2>
        <p className="mt-2 font-display text-2xl font-semibold sm:text-4xl">{verdictText(result, names)}</p>
        <div className="mt-6">
          <ProbabilityBar a={a.name} b={b.name} percent={percent} />
        </div>
        <p className="mt-6 text-sm">
          <Link href={`/matchups/${b.slug}/${a.slug}`} className="underline underline-offset-4">
            Swap sides
          </Link>
        </p>
      </section>

      <section className="mt-10" aria-labelledby="community">
        <h2 id="community" className="eyebrow">
          Community vote
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Who do you think wins? Voting needs a verified account. It does not change the verdict above.
        </p>
        <div className="mt-4">
          <CommunityVote
            a={{ slug: a.slug, name: a.name }}
            b={{ slug: b.slug, name: b.name }}
            initial={data.community}
          />
        </div>
      </section>

      <section className="mt-10" aria-labelledby="compare">
        <h2 id="compare" className="eyebrow">
          Side by side
        </h2>
        <dl className="mt-2 border-t">
          <Row label="Attack potency" a={tierText(a.attackPotency)} b={tierText(b.attackPotency)} />
          <Row label="Durability" a={tierText(a.durability)} b={tierText(b.durability)} />
          <Row label="Speed" a={a.speed} b={b.speed} />
          <Row label="Dimensionality" a={dimensionLabel(a.dimension)} b={dimensionLabel(b.dimension)} />
          <Row label="Abilities" a={<Abilities claims={a.hax} />} b={<Abilities claims={b.hax} />} />
          <Row label="Resistances" a={<Abilities claims={a.resistances} />} b={<Abilities claims={b.resistances} />} />
          <Row
            label="Verified feats"
            a={`${a.verifiedFeatCount} of ${a.featCount}`}
            b={`${b.verifiedFeatCount} of ${b.featCount}`}
          />
        </dl>
      </section>

      <section className="mt-10" aria-labelledby="why">
        <h2 id="why" className="eyebrow">
          Why
        </h2>
        <ul className="mt-2 divide-y border-y">
          {result.reasons.map((reason, index) => (
            <li key={index} className="py-4">
              <p className="eyebrow">{favorsText(reason.favors, names)}</p>
              <p className="mt-1 text-sm">{reason.note}</p>
            </li>
          ))}
        </ul>
      </section>

      <p className="mt-8 text-sm text-muted-foreground">
        The verdict comes from fixed rules applied to each character&apos;s profile. It is not an opinion and it
        changes only when a feat is verified.
        {baseline.length > 0
          ? ` ${baseline.map((side) => side.name).join(" and ")} ${baseline.length > 1 ? "have" : "has"} no verified feats yet, so ${baseline.length > 1 ? "their profiles use" : "the profile uses"} the starting baseline.`
          : ""}
      </p>
    </article>
  );
}