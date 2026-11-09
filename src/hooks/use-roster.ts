"use client";

import { useEffect, useState } from "react";
import type { BattleCard } from "@/lib/battle/view";

let cached: BattleCard[] | null = null;

export function useRoster() {
  const [cards, setCards] = useState<BattleCard[] | null>(cached);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (cached) return;
    let live = true;
    fetch("/api/battle/roster")
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error("roster"))))
      .then((data: { cards: BattleCard[] }) => {
        cached = data.cards;
        if (live) setCards(data.cards);
      })
      .catch(() => live && setFailed(true));
    return () => {
      live = false;
    };
  }, []);

  return { cards, failed };
}