import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { CharacterHero } from "@/components/characters/character-hero";
import { PowerProfileCard } from "@/components/characters/power-profile";
import { FeatSection } from "@/components/feats/feat-section";
import { fetchCharacterPage } from "@/lib/data/character-page";

export const revalidate = 60;

type Props = { params: Promise<{ slug: string }> };

const getPage = cache(fetchCharacterPage);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await getPage(slug);
  if (!data) return { title: "Not found | NONI" };
  const { character } = data;
  return {
    title: `${character.name} | NONI`,
    description: `${character.name} from ${character.verse}: tier ${character.tier}, ${character.speed}.`,
  };
}

export default async function CharacterPage({ params }: Props) {
  const { slug } = await params;
  const data = await getPage(slug);
  if (!data) notFound();

  return (
    <div className="mx-auto max-w-6xl px-4 pt-8 pb-24">
      <CharacterHero c={data.character} />
      <PowerProfileCard profile={data.character.profile} />
      <FeatSection characterId={data.character.id} initialFeats={data.feats} />
    </div>
  );
}