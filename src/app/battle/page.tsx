import type { Metadata } from "next";
import { BattleHub } from "@/components/battle/battle-hub";

export const metadata: Metadata = {
  title: "Battle",
  description: "Team battles and tournaments. Pick your fighters, watch it play out, and earn or risk Glaze.",
};

export default function BattlePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 pt-4 pb-24 lg:max-w-6xl">
      <h1 className="sr-only">Battle</h1>
      <BattleHub />
    </div>
  );
}