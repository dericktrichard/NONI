import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ProfileForm } from "@/components/profile/profile-form";
import { getOwnProfile } from "@/lib/data/profile";
import { getSessionUser } from "@/lib/security/session";

export const metadata: Metadata = { title: "Set up your profile", robots: { index: false, follow: false } };

export default async function ProfileSettingsPage() {
  const user = await getSessionUser();

  if (!user) {
    return (
      <div className="mx-auto max-w-lg px-4 pt-8 pb-24">
        <h1 className="font-display text-4xl font-semibold tracking-tight">Your profile</h1>
        <p className="mt-4 border p-4 text-sm text-muted-foreground">Sign in to set up your profile.</p>
      </div>
    );
  }

  const profile = await getOwnProfile(user.uid);
  if (profile.handle) redirect(`/u/${profile.handle}`);

  return (
    <div className="mx-auto max-w-lg px-4 pt-8 pb-24">
      <p className="eyebrow">Welcome</p>
      <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight">Choose your handle</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        This is your public name on NONI. Your profile page and lists live at it.
      </p>
      <div className="mt-8 border p-5">
        <ProfileForm initial={profile} verified={user.email_verified === true} />
      </div>
    </div>
  );
}