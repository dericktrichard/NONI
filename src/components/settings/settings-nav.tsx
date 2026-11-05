import Link from "next/link";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "profile", href: "/settings/profile", label: "Profile" },
  { id: "lists", href: "/settings/lists", label: "Lists" },
] as const;

export function SettingsNav({ current }: { current: (typeof TABS)[number]["id"] }) {
  return (
    <nav aria-label="Settings" className="mt-6 flex border-b">
      {TABS.map((tab) => (
        <Link
          key={tab.id}
          href={tab.href}
          aria-current={tab.id === current ? "page" : undefined}
          className={cn(
            "-mb-px flex min-h-11 items-center border-b-2 px-4 text-sm font-medium transition-colors",
            tab.id === current
              ? "border-accent text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}