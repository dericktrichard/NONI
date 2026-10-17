import { dimensionLabel } from "@/config/scales";
import { kindText, tierText } from "@/lib/feats/labels";
import type { HaxClaim } from "@/lib/ranking/profile";
import type { PowerProfile } from "@/types/domain";

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[8rem_1fr] gap-4 py-3 sm:grid-cols-[12rem_1fr]">
      <dt className="eyebrow pt-1">{label}</dt>
      <dd className="min-w-0 font-medium">{children}</dd>
    </div>
  );
}

function Abilities({ claims }: { claims: HaxClaim[] }) {
  if (claims.length === 0) return <span className="font-normal text-muted-foreground">None recorded</span>;
  return (
    <ul className="flex flex-wrap gap-2">
      {claims.map((claim) => (
        <li key={claim.kind} className="border px-2 py-1 text-sm font-normal">
          {kindText(claim.kind)} <span className="tabular text-muted-foreground">{claim.power}</span>
        </li>
      ))}
    </ul>
  );
}

export function PowerProfileCard({ profile }: { profile: PowerProfile }) {
  return (
    <section aria-labelledby="profile-heading" className="mt-10">
      <h2 id="profile-heading" className="eyebrow">
        Power profile
      </h2>
      <dl className="mt-3 divide-y border-y">
        <Row label="Attack potency">{tierText(profile.attackPotency)}</Row>
        <Row label="Durability">{tierText(profile.durability)}</Row>
        <Row label="Speed">{profile.speed}</Row>
        <Row label="Dimensionality">{dimensionLabel(profile.dimension)}</Row>
        <Row label="Abilities">
          <Abilities claims={profile.hax} />
        </Row>
        <Row label="Resistances">
          <Abilities claims={profile.resistances} />
        </Row>
      </dl>
    </section>
  );
}