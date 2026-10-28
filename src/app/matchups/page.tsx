import type { Metadata } from "next";
import { MatchupPicker } from "@/components/matchups/matchup-picker";
import { fetchCharacterOptions } from "@/lib/data/matchup-page";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Matchups",
  description: "Pick two characters and see how they compare, with the reasons.",
};

export default async function MatchupsPage() {
  const options = await fetchCharacterOptions();

  return (
    <div className="mx-auto max-w-4xl px-4 pt-8 pb-24">
      <p className="eyebrow">Matchups</p>
      <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight">Who wins?</h1>
      <p className="mt-3 max-w-xl text-sm text-muted-foreground">
        Pick two characters. The result comes from verified feats and fixed rules, and every verdict shows its reasons.
      </p>

      <div className="mt-8">
        {options.length < 2 ? (
          <p className="text-sm text-muted-foreground">At least two characters are needed to compare.</p>
        ) : (
          <MatchupPicker options={options} />
        )}
      </div>
    </div>
  );
}