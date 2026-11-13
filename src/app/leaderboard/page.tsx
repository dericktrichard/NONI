import type { Metadata } from "next";
import { BoardTabs } from "@/components/standing/board-tabs";
import { MyStanding } from "@/components/standing/my-standing";
import { getBankPage } from "@/lib/data/banks";
import { getFanPage } from "@/lib/data/fan-groups";
import { getPublicListPage } from "@/lib/data/public-lists";
import { getBoard } from "@/lib/data/standing";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Leaderboard",
  description:
    "Top Glaze, weekly climbers, tournament champions, the biggest fans and new lists.",
};

export default async function LeaderboardPage() {
  const [glaze, week, champions, fans, banks, lists] = await Promise.all([
    getBoard("glaze"),
    getBoard("week"),
    getBoard("champions"),
    getFanPage(0),
    getBankPage("all", 0),
    getPublicListPage(null),
  ]);

  return (
    <div className="mx-auto max-w-3xl px-4 pt-8 pb-24 sm:pt-12">
      <p className="eyebrow mt-8">Standing</p>
      <h1 className="font-display mt-2 text-4xl font-semibold tracking-tight sm:text-6xl">
        Who is on top?
      </h1>
      <MyStanding />
      <BoardTabs boards={{ glaze, week, champions, fans, banks }} lists={lists} />
    </div>
  );
}
