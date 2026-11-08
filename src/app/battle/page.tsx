import type { Metadata } from "next";
import { ClashGame } from "@/components/battle/clash-game";

export const metadata: Metadata = {
  title: "Team Battle",
  description: "Pick a team, face an opposing team, and watch who wins and who survives. Earn Glaze for every battle.",
};

export default function BattlePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 pt-8 pb-24 sm:pt-12">
      <p className="eyebrow">Team battle</p>
      <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight sm:text-6xl">Your team vs theirs</h1>
      <p className="mt-3 max-w-xl text-sm text-muted-foreground">
        Pick a team or let us build one, then choose your opponents or have us counter your team. No character can be on
        both sides. Winners stay on the field, wounded, until one team has fallen.
      </p>
      <ClashGame />
    </div>
  );
}