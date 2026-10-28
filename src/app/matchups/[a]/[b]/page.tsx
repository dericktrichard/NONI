import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { MatchupView } from "@/components/matchups/matchup-view";
import { fetchMatchupPage } from "@/lib/data/matchup-page";
import { verdictText } from "@/lib/matchup/labels";

export const revalidate = 60;

const load = cache(fetchMatchupPage);

type Props = { params: Promise<{ a: string; b: string }> };

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

  return (
    <div className="mx-auto max-w-4xl px-4 pt-8 pb-24">
      <MatchupView data={data} />
    </div>
  );
}