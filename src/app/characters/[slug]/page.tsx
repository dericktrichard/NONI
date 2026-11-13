import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { CharacterAside } from "@/components/characters/character-aside";
import { CharacterHero } from "@/components/characters/character-hero";
import { PowerProfileCard } from "@/components/characters/power-profile";
import { FeatSection } from "@/components/feats/feat-section";
import { PageTop } from "@/components/layout/page-top";
import { BankPanel } from "@/components/bank/bank-panel";
import { TopFans } from "@/components/standing/top-fans";
import { fetchCharacterPage } from "@/lib/data/character-page";
import { getBank } from "@/lib/data/banks";
import { getTopFans } from "@/lib/data/standing";

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
  const [fans, bank] = await Promise.all([getTopFans(slug), getBank(slug)]);

  return (
    <div className="mx-auto max-w-6xl px-4 pt-6 pb-24">
      <PageTop
        back={{ href: "/", label: "Explore" }}
        trail={[
          { label: "Explore", href: "/" },
          { label: data.character.verse },
          { label: data.character.name },
        ]}
      />

      <CharacterHero c={data.character} />

      <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_18rem]">
        <div className="min-w-0">
          <PowerProfileCard profile={data.character.profile} />
          <FeatSection characterId={data.character.id} initialFeats={data.feats} />
        </div>
        <CharacterAside c={data.character}>
          <TopFans fans={fans} name={data.character.name} />
          <BankPanel slug={slug} name={data.character.name} bank={bank} />
        </CharacterAside>
      </div>
    </div>
  );
}
