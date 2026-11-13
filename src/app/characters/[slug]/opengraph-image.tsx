import { ImageResponse } from "next/og";
import { fetchCharacterCard } from "@/lib/data/share-data";
import { BrandCard, CARD_SIZE, CharacterCard } from "@/lib/share/cards";
import { portraitDataUri } from "@/lib/share/portrait";

export const alt = "NONI character card";
export const size = CARD_SIZE;
export const contentType = "image/png";
export const revalidate = 3600;

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await fetchCharacterCard(slug);
  if (!data) return new ImageResponse(<BrandCard />, size);

  const portrait = await portraitDataUri(data.imageUrl, 626, 940);
  return new ImageResponse(
    <CharacterCard
      name={data.name}
      verse={data.verse}
      tier={data.tier}
      score={data.score}
      rank={data.rank}
      verified={data.verified}
      total={data.total}
      portrait={portrait}
    />,
    size,
  );
}
