"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AuthDialog } from "@/components/auth/auth-dialog";
import { ProfileForm } from "@/components/profile/profile-form";
import { Modal } from "@/components/ui/modal";
import { useSession } from "@/hooks/use-session";
import { signOutEverywhere } from "@/lib/auth/client";
import { OPEN_SIGN_IN } from "@/lib/auth/events";
import { OPEN_PROFILE_SETUP } from "@/lib/ui/events";

export function AuthHost() {
  const { state, refresh } = useSession();
  const router = useRouter();
  const [signInOpen, setSignInOpen] = useState(false);
  const [setupOpen, setSetupOpen] = useState(false);

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

      <Modal open={setupOpen && user !== null} onClose={() => setSetupOpen(false)} eyebrow="Welcome" title="Choose your handle">
        {user ? (
          <>
            <p className="mb-5 text-sm text-muted-foreground">
              This is your public name on NONI. Your profile page and lists live at it.
            </p>
            <ProfileForm
              initial={{ handle: null, bio: "", cooldownDays: 0 }}
              verified={user.verified}
              onSaved={() => {
                setSetupOpen(false);
                void refresh();
              }}
            />
            <button type="button" className="btn btn-quiet btn-sm mt-4" onClick={() => void leave()}>
              Sign out
            </button>
          </>
        ) : null}
      </Modal>
    </>
  );
}