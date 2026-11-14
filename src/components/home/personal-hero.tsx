"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useSession } from "@/hooks/use-session";
import { postJson } from "@/lib/battle/client";
import type { PlusState } from "@/lib/data/plus";
import { cn } from "@/lib/utils";

/** The owner's own banner over the home hero. The page stays cached for everyone, so this runs in the browser. */
export function PersonalHero() {
  const { state } = useSession();
  const uid = state.status === "ready" ? (state.user?.uid ?? null) : null;
  const [banner, setBanner] = useState<{ url: string; position: string } | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!uid) return;
    let live = true;
    void postJson<PlusState>("/api/plus", { op: "state" }).then((reply) => {
      if (!live) return;
      const mine = reply.ok ? reply.data.banner : null;
      setBanner(mine?.url ? { url: mine.url, position: mine.position } : null);
    });
    return () => {
      live = false;
    };
  }, [uid]);

  if (!uid || !banner) return null;

  return (
    <Image
      src={banner.url}
      alt=""
      fill
      loading="eager"
      sizes="100vw"
      onLoad={() => setLoaded(true)}
      style={{ objectPosition: banner.position }}
      className={cn(
        "object-cover transition-opacity duration-700",
        loaded ? "opacity-100" : "opacity-0",
      )}
    />
  );
}
