"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export function Bio({ text }: { text: string }) {
  const [open, setOpen] = useState(false);

  return (
    <button
      type="button"
      aria-expanded={open}
      onClick={() => setOpen((value) => !value)}
      className={cn(
        "mt-1 block w-full text-left text-sm break-words whitespace-pre-line",
        !open && "line-clamp-3 sm:line-clamp-2",
      )}
    >
      {text}
    </button>
  );
}
