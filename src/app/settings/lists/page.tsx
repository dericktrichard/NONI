import type { Metadata } from "next";
import Link from "next/link";
import { ListsManager } from "@/components/lists/lists-manager";
import { SettingsNav } from "@/components/settings/settings-nav";
import { getOwnLists, listCharacterOptions } from "@/lib/data/lists";
import { getOwnProfile } from "@/lib/data/profile";
import { getSessionUser } from "@/lib/security/session";

export const metadata: Metadata = { title: "Your lists", robots: { index: false, follow: false } };

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-2xl px-4 pt-8 pb-24">
      <p className="eyebrow">Settings</p>
      <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight">Your lists</h1>
      <SettingsNav current="lists" />
      {children}
    </div>
  );
}

export default async function ListsSettingsPage() {
  const user = await getSessionUser();

  if (!user) {
    return (
      <Shell>
        <p className="mt-8 border p-4 text-sm text-muted-foreground">Sign in to make lists.</p>
      </Shell>
    );
  }

  const profile = await getOwnProfile(user.uid);

  if (!profile.handle) {
    return (
      <Shell>
        <p className="mt-8 border p-4 text-sm">
          Lists appear on your public profile, so{" "}
          <Link href="/settings/profile" className="underline underline-offset-4">
            choose a handle
          </Link>{" "}
          first.
        </p>
      </Shell>
    );
  }

  const [lists, options] = await Promise.all([getOwnLists(user.uid), listCharacterOptions()]);

  return (
    <Shell>
      <p className="mt-6 text-sm text-muted-foreground">
        Ranked lists with a reason for each entry, shown on{" "}
        <Link href={`/u/${profile.handle}`} className="underline underline-offset-4">
          your profile
        </Link>
        .
      </p>
      <ListsManager lists={lists} options={options} />
    </Shell>
  );
}