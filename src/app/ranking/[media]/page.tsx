import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RankingBoard } from "@/components/characters/ranking-board";
import { SectionHeading } from "@/components/home/section-heading";
import { MEDIA_LABELS, MEDIA_TYPES, isMediaType } from "@/config/media";
import { fetchCharacters } from "@/lib/data/characters";
import { PAGE, makePlan, type Facet } from "@/lib/data/query";

export const revalidate = 300;
export const dynamicParams = false;

export function generateStaticParams() {
  return MEDIA_TYPES.map((media) => ({ media }));
}

type Props = { params: Promise<{ media: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { media } = await params;
  if (!isMediaType(media)) return { title: "Ranking" };
  return {
    title: `${MEDIA_LABELS[media]} ranking`,
    description: `The strongest ${MEDIA_LABELS[media].toLowerCase()} characters on NONI, ranked by cited evidence.`,
  };
}

export default async function MediaRankingPage({ params }: Props) {
  const { media } = await params;
  if (!isMediaType(media)) notFound();

  const facet: Facet = { kind: "media", media };
  const initial = await fetchCharacters(makePlan(facet, PAGE.default, null));

  return (
    <main className="mx-auto max-w-6xl px-4 pt-8 pb-24 sm:pt-12">
      <SectionHeading index="01" title={`${MEDIA_LABELS[media]} ranking`} aside="By medium" />
      <p className="mt-3 text-sm">
        <Link href="/ranking" className="underline underline-offset-4">
          All characters
        </Link>
      </p>
      <div className="mt-6">
        <RankingBoard initial={initial} initialFacet={facet} />
      </div>
    </main>
  );
}