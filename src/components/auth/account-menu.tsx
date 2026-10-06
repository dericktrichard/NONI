"use client";

import { useEffect, useRef, useState } from "react";
import { LogOut, User } from "lucide-react";
import { AuthDialog } from "@/components/auth/auth-dialog";
import { Button } from "@/components/ui/button";
import { useSession } from "@/hooks/use-session";
import { signOutEverywhere } from "@/lib/auth/client";

export function AccountMenu() {
  const { state, refresh } = useSession();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onPointer = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  async function leave() {
    setLeaving(true);
    try {
      await signOutEverywhere();
    } finally {
      setLeaving(false);
      setMenuOpen(false);
      await refresh();
    }
  }

  if (state.status === "loading") return <div className="h-9 w-20" aria-hidden />;

  if (!state.user) {
    return (
      <>
        <Button size="sm" variant="outline" onClick={() => setDialogOpen(true)}>
          Sign in
        </Button>
        <AuthDialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          onSignedIn={async () => {
            await refresh();
            setDialogOpen(false);
          }}
        />
      </>
    );
  }

  return (
    <div ref={root} className="relative">
      <Button
        variant="ghost"
        size="icon"
        aria-label="Account"
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen((value) => !value)}
      >
        <User className="size-5" />
      </Button>
      {menuOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded-sm border bg-background p-4">
          <p className="text-sm font-medium">{state.user.verified ? "Email verified" : "Email not verified"}</p>
          {!state.user.verified && (
            <p className="mt-1 text-xs text-foreground/70">
              Open the link we emailed you, then sign in again. Voting and submitting need a verified email.
            </p>
          )}
          <Button variant="outline" size="sm" className="mt-4 w-full" onClick={() => void leave()} disabled={leaving}>
            <LogOut className="size-4" aria-hidden />
            Sign out
          </Button>
        </div>
      )}
    </div>
  );
}