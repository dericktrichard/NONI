"use client";

import { useEffect } from "react";

/** How many screens currently want play mode. The bars come back only when the last one lets go. */
let holders = 0;

/** While active on a small screen the nav bars hide so the stage gets the whole screen. The rules are in globals.css. */
export function PlayMode({ active }: { active: boolean }) {
  useEffect(() => {
    if (!active) return;
    const root = document.documentElement;
    holders += 1;
    root.dataset.play = "true";
    return () => {
      holders -= 1;
      if (holders <= 0) {
        holders = 0;
        delete root.dataset.play;
      }
    };
  }, [active]);

  return null;
}
