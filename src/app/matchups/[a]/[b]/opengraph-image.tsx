import { ImageResponse } from "next/og";
import { fetchMatchupPage } from "@/lib/data/matchup-page";
import { verdictText } from "@/lib/matchup/labels";
import { BrandCard, CARD_SIZE, MatchupCard } from "@/lib/share/cards";
import { portraitDataUri } from "@/lib/share/portrait";

export const alt = "NONI matchup card";
export const size = CARD_SIZE;
export const contentType = "image/png";
export const revalidate = 3600;

export default async function Image({ params }: { params: Promise<{ a: string; b: string }> }) {
  const { a, b } = await params;

  let data = null;
  try {
    data = await fetchMatchupPage(a, b);
  } catch (error) {
    console.error("matchup card read failed", error);
  }
  if (!data) return new ImageResponse(<BrandCard />, size);

  const [portraitA, portraitB] = await Promise.all([
    portraitDataUri(data.a.imageUrl, 600, 740),
    portraitDataUri(data.b.imageUrl, 600, 740),
  ]);

  return new ImageResponse(
    (
      <MatchupCard
        a={{ name: data.a.name, verse: data.a.verse, portrait: portraitA }}
        b={{ name: data.b.name, verse: data.b.verse, portrait: portraitB }}
        winner={data.result.winner}
        verdict={verdictText(data.result, { a: data.a.name, b: data.b.name })}
      />
    ),
    size,
  );
}