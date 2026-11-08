"use client";

import { useEffect, useState } from "react";

export function useGlaze() {
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    let live = true;
    fetch("/api/glaze", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (live && typeof data?.balance === "number") setBalance(data.balance);
      })
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, []);

  return [balance, setBalance] as const;
}