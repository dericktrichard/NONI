import { ArrowUpRight, Swords, Trophy, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const swatches = [
  ["background", "bg-background"],
  ["foreground", "bg-foreground"],
  ["muted", "bg-muted"],
  ["border", "bg-border"],
  ["accent", "bg-accent"],
  ["danger", "bg-danger"],
];

export default function Home() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <p className="eyebrow">Design system</p>
      <h1 className="mt-2 text-4xl font-semibold tracking-tight sm:text-6xl">
        Evidence decides.
      </h1>
      <p className="mt-4 max-w-xl text-muted-foreground">
        Every ranking on NONI traces back to a cited feat. No proof, no points.
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        <Button variant="primary" size="lg">
          Browse rankings <ArrowUpRight className="size-4" aria-hidden />
        </Button>
        <Button variant="outline" size="lg">
          Start a matchup
        </Button>
      </div>

      <section className="mt-12">
        <p className="eyebrow">Palette</p>
        <div className="mt-3 grid grid-cols-2 gap-px border bg-border sm:grid-cols-6">
          {swatches.map(([name, cls]) => (
            <div key={name} className="bg-background p-3">
              <div className={`h-12 border ${cls}`} />
              <p className="eyebrow mt-2">{name}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <p className="eyebrow">Buttons and badges</p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Button variant="primary">Primary</Button>
          <Button variant="solid">Solid</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button disabled>Disabled</Button>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Badge>Default</Badge>
          <Badge variant="accent">Verified</Badge>
          <Badge variant="outline">Tier 3</Badge>
        </div>
      </section>

      <section className="mt-12">
        <p className="eyebrow">Ranking row preview</p>
        <ul className="mt-3 border-y">
          {[
            ["01", "Saitama", "One Punch Man", "9840"],
            ["02", "Goku", "Dragon Ball", "9712"],
            ["03", "Superman", "DC Comics", "9655"],
          ].map(([rank, name, verse, score]) => (
            <li key={rank} className="flex items-center gap-4 border-b py-4 last:border-b-0">
              <span className="tabular w-8 text-sm text-muted-foreground">{rank}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{name}</p>
                <p className="eyebrow">{verse}</p>
              </div>
              <span className="tabular text-lg font-semibold">{score}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-12">
        <p className="eyebrow">Icons (Lucide)</p>
        <div className="mt-3 flex gap-6">
          <Trophy className="size-6" strokeWidth={1.75} aria-hidden />
          <Swords className="size-6" strokeWidth={1.75} aria-hidden />
          <Users className="size-6" strokeWidth={1.75} aria-hidden />
        </div>
      </section>
    </main>
  );
}