"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <Button
      variant="outline"
      size="icon"
      aria-label="Toggle theme"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      {/* CSS decides which icon shows, so there is no hydration mismatch */}
      <Sun className="size-5 dark:hidden" strokeWidth={1.75} aria-hidden />
      <Moon className="hidden size-5 dark:block" strokeWidth={1.75} aria-hidden />
    </Button>
  );
}