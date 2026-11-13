import { SectionHeading } from "@/components/home/section-heading";
import { dimensionLabel } from "@/config/scales";
import { kindText, tierText } from "@/lib/feats/labels";
import type { HaxClaim } from "@/lib/ranking/profile";
import type { PowerProfile } from "@/types/domain";

function Tile({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="bg-background p-4">
      <dt className="eyebrow">{label}</dt>
      <dd className="font-display mt-1 text-xl leading-tight font-semibold">
        {children}
      </dd>
    </div>
  );
}

function Abilities({ claims }: { claims: HaxClaim[] }) {
  if (claims.length === 0)
    return <span className="text-muted-foreground text-sm">None recorded</span>;
  return (
    <ul className="flex flex-wrap gap-2">
      {claims.map((claim) => (
        <li key={claim.kind} className="border px-2 py-1 text-sm">
          {kindText(claim.kind)}{" "}
          <span className="tabular text-muted-foreground">{claim.power}</span>
        </li>
      ))}
    </ul>
  );
}

export function PowerProfileCard({ profile }: { profile: PowerProfile }) {
  return (
    <section aria-label="Power profile">
      <SectionHeading index="01" title="Power profile" />

      <dl className="bg-border mt-6 grid grid-cols-2 gap-px border">
        <Tile label="Attack potency">{tierText(profile.attackPotency)}</Tile>
        <Tile label="Durability">{tierText(profile.durability)}</Tile>
        <Tile label="Speed">{profile.speed}</Tile>
        <Tile label="Dimensionality">{dimensionLabel(profile.dimension)}</Tile>
      </dl>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="border p-4">
          <p className="eyebrow">Abilities</p>
          <div className="mt-3">
            <Abilities claims={profile.hax} />
          </div>
        </div>
        <div className="border p-4">
          <p className="eyebrow">Resistances</p>
          <div className="mt-3">
            <Abilities claims={profile.resistances} />
          </div>
        </div>
      </div>
    </section>
  );
}
