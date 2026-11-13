"use client";

import { useSyncExternalStore } from "react";
import { daypartOf } from "@/lib/home/daypart";

const subscribe = (notify: () => void) => {
  const id = setInterval(notify, 60_000);
  return () => clearInterval(id);
};

const snapshot = (): number | null => daypartOf(new Date().getHours());
/** The server cannot know the visitor's hour, so nothing is picked until the browser answers */
const server = (): number | null => null;

export const useDaypart = () => useSyncExternalStore(subscribe, snapshot, server);
