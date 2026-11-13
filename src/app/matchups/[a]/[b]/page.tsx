import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { PageTop } from "@/components/layout/page-top";
import { NewMatchupButton, SurpriseButton } from "@/components/matchups/matchup-actions";
import { MatchupView } from "@/components/matchups/matchup-view";
import { ShareButton } from "@/components/share/share-button";
import { fetchMatchupPage, type MatchupSideView } from "@/lib/data/matchup-page";
import { verdictText } from "@/lib/matchup/labels";
import type { MatchupPreset } from "@/lib/matchup/preset";

export const revalidate = 60;

const load = cache(fetchMatchupPage);

type Props = { params: Promise<{ a: string; b: string }> };

const presetOf = (side: MatchupSideView): MatchupPreset => ({
  id: side.slug,
  name: side.name,
  verse: side.verse,
  imageUrl: side.imageUrl,
  tier: side.tier,
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { a, b } = await params;
  const data = await load(a, b);
  if (!data) return { title: "Matchup not found" };

  const names = { a: data.a.name, b: data.b.name };
  return {
    title: `${names.a} vs ${names.b}`,
    description: `${verdictText(data.result, names)}. See the full breakdown on NONI.`,
  };
}

export default async function MatchupPage({ params }: Props) {
  const { a, b } = await params;
  const data = await load(a, b);
  if (!data) notFound();

  const names = { a: data.a.name, b: data.b.name };

  return (
    <div className="mx-auto max-w-4xl px-4 pt-6 pb-24">
      <PageTop
        back={{ href: "/matchups", label: "Matchups" }}
        trail={[
          { label: "Matchups", href: "/matchups" },
          { label: `${data.a.name} vs ${data.b.name}` },
        ]}
      />
      <MatchupView data={data} />

      <section className="mt-12 border p-4 sm:p-6" aria-label="Keep going">
        <p className="eyebrow">Keep going</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <NewMatchupButton preset={presetOf(data.a)} className="btn btn-line btn-sm">
            Another opponent for {data.a.name}
          </NewMatchupButton>
          <NewMatchupButton preset={presetOf(data.b)} className="btn btn-line btn-sm">
            Another opponent for {data.b.name}
          </NewMatchupButton>
          <SurpriseButton className="btn btn-quiet btn-sm">Surprise me</SurpriseButton>
          <ShareButton
            title={`${names.a} vs ${names.b}`}
            text={`${verdictText(data.result, names)}. Settle it on NONI.`}
            className="btn btn-quiet btn-sm"
          />
        </div>
      </section>
    </div>
  );
}
