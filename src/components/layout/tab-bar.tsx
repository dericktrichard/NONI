"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "@/hooks/use-session";
import { OPEN_SIGN_IN } from "@/lib/auth/events";
import { OPEN_PROFILE_SETUP, OPEN_SEARCH } from "@/lib/ui/events";
import { cn } from "@/lib/utils";

const TAB = "eyebrow relative grid h-14 place-items-center transition-colors";

function Mark() {
  return <span className="absolute inset-x-5 top-0 h-0.5 bg-accent" aria-hidden />;
}

export function TabBar() {
  const pathname = usePathname();
  const { state } = useSession();
  const user = state.status === "ready" ? state.user : null;

  const exploreActive = pathname === "/" || pathname.startsWith("/ranking") || pathname.startsWith("/characters");
  const matchupsActive = pathname.startsWith("/matchups");
  const meActive = user?.handle ? pathname === `/u/${user.handle}` : false;

  return (
    <nav
      aria-label="Mobile"
      className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[calc(0.5rem+env(safe-area-inset-bottom))] sm:hidden"
    >
      <div className="acrylic grid grid-cols-4">
        <Link href="/" aria-current={exploreActive ? "page" : undefined} className={cn(TAB, exploreActive && "text-foreground")}>
          {exploreActive ? <Mark /> : null}
          Explore
        </Link>
        <Link
          href="/matchups"
          aria-current={matchupsActive ? "page" : undefined}
          className={cn(TAB, matchupsActive && "text-foreground")}
        >
          {matchupsActive ? <Mark /> : null}
          Matchups
        </Link>
        <button type="button" className={TAB} onClick={() => window.dispatchEvent(new Event(OPEN_SEARCH))}>
          Search
        </button>

        {state.status === "loading" ? (
          <span className={TAB}>Me</span>
        ) : !user ? (
          <button type="button" className={TAB} onClick={() => window.dispatchEvent(new Event(OPEN_SIGN_IN))}>
            Sign in
          </button>
        ) : user.handle ? (
          <Link href={`/u/${user.handle}`} aria-current={meActive ? "page" : undefined} className={cn(TAB, meActive && "text-foreground")}>
            {meActive ? <Mark /> : null}
            Me
          </Link>
        ) : (
          <button type="button" className={TAB} onClick={() => window.dispatchEvent(new Event(OPEN_PROFILE_SETUP))}>
            Me
          </button>
        )}
      </div>
    </nav>
  );
}