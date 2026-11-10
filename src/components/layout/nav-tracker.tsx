"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

export const NAV_KEY = "noni:navs";

export function NavTracker() {
  const pathname = usePathname();

  useEffect(() => {
    try {
      const count = Number(sessionStorage.getItem(NAV_KEY)) || 0;
      sessionStorage.setItem(NAV_KEY, String(count + 1));
    } catch {
      /* storage can be blocked */
    }
  }, [pathname]);

  return null;
}
