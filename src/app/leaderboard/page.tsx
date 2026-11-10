import type { Metadata } from "next";
import { SectionTabs } from "@/components/layout/section-tabs";
import { BoardTabs } from "@/components/standing/board-tabs";
import { MyStanding } from "@/components/standing/my-standing";
import { getBoard, getFansBoard } from "@/lib/data/standing";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Leaderboard",
  description: "Top Glaze, weekly climbers, tournament champions and the biggest fans.",
};

export default async function LeaderboardPage() {
  const [glaze, week, champions, fans] = await Promise.all([
    getBoard("glaze"),
    getBoard("week"),
    getBoard("champions"),
    getFansBoard(),
  ]);

  return (
    <div className="mx-auto max-w-3xl px-4 pt-8 pb-24 sm:pt-12">
      <SectionTabs />
      <p className="eyebrow mt-8">Standing</p>
      <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight sm:text-6xl">Who is on top?</h1>
      <p className="mt-3 max-w-xl text-sm text-muted-foreground">
        Ranked from real battles. Only players who opt in appear here, and you can leave at any time.
      </p>
      <MyStanding />
      <BoardTabs boards={{ glaze, week, champions, fans }} />
    </div>
  );
}