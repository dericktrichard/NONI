"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <button
      type="button"
      aria-label="Toggle theme"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className="hover:border-foreground grid size-9 place-items-center border transition-colors sm:size-8"
    >
      {/* CSS decides which icon shows, so there is no hydration mismatch */}
      <Sun className="size-4 dark:hidden" strokeWidth={1.75} aria-hidden />
      <Moon className="hidden size-4 dark:block" strokeWidth={1.75} aria-hidden />
    </button>
  );
}
