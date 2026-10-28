import type { Metadata } from "next";
import { ProfileForm } from "@/components/profile/profile-form";
import { getOwnProfile } from "@/lib/data/profile";
import { getSessionUser } from "@/lib/security/session";

export const metadata: Metadata = { title: "Profile settings", robots: { index: false, follow: false } };

export default async function ProfileSettingsPage() {
  const user = await getSessionUser();

  if (!user) {
    return (
      <div className="mx-auto max-w-2xl px-4 pt-8 pb-24">
        <h1 className="font-display text-4xl font-semibold tracking-tight">Your profile</h1>
        <p className="mt-4 text-sm text-muted-foreground">Sign in to set up your profile.</p>
      </div>
    );
  }

  const profile = await getOwnProfile(user.uid);

  return (
    <div className="mx-auto max-w-2xl px-4 pt-8 pb-24">
      <p className="eyebrow">Settings</p>
      <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight">Your profile</h1>
      <ProfileForm initial={profile} verified={user.email_verified === true} />
    </div>
  );
}