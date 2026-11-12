"use client";

import { useSyncExternalStore } from "react";
import { daypartOf } from "@/lib/home/daypart";

const subscribe = (notify: () => void) => {
  const id = setInterval(notify, 60_000);
  return () => clearInterval(id);
};

const snapshot = () => daypartOf(new Date().getHours());
const server = () => 0;

export const useDaypart = () => useSyncExternalStore(subscribe, snapshot, server);
