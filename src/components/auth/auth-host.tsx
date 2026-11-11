"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AuthDialog } from "@/components/auth/auth-dialog";
import { Onboarding } from "@/components/auth/onboarding";
import { markWelcomed, useWelcomed } from "@/hooks/use-welcomed";
import { useSession } from "@/hooks/use-session";
import { signOutEverywhere } from "@/lib/auth/client";
import { OPEN_SIGN_IN } from "@/lib/auth/events";
import { OPEN_PROFILE_SETUP } from "@/lib/ui/events";

export function AuthHost() {
  const { state, refresh } = useSession();
  const router = useRouter();
  const [signInOpen, setSignInOpen] = useState(false);
  const [setupOpen, setSetupOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const openSignIn = () => setSignInOpen(true);
    const openSetup = () => setSetupOpen(true);
    window.addEventListener(OPEN_SIGN_IN, openSignIn);
    window.addEventListener(OPEN_PROFILE_SETUP, openSetup);
    return () => {
      window.removeEventListener(OPEN_SIGN_IN, openSignIn);
      window.removeEventListener(OPEN_PROFILE_SETUP, openSetup);
    };
  }, []);

  const user = state.status === "ready" ? state.user : null;
  const welcomed = useWelcomed(user?.uid ?? null);
  const pending = user !== null && (!user.handle || !welcomed);

  function closeSetup() {
    setSetupOpen(false);
    setDismissed(true);
    if (user?.handle) markWelcomed(user.uid);
  }

  async function leave() {
    try {
      await signOutEverywhere();
    } finally {
      setSetupOpen(false);
      await refresh();
      router.push("/");
      router.refresh();
    }
  }

  return (
    <>
      <AuthDialog
        open={signInOpen}
        onClose={() => setSignInOpen(false)}
        onSignedIn={async () => {
          await refresh();
          setSignInOpen(false);
          router.refresh();
        }}
      />

      <Onboarding
        open={setupOpen || (pending && !dismissed)}
        user={user}
        onClose={closeSetup}
        onSignOut={() => void leave()}
        refresh={refresh}
      />
    </>
  );
}
