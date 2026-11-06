import { redirect } from "next/navigation";
import { getOwnProfile } from "@/lib/data/profile";
import { getSessionUser } from "@/lib/security/session";

export default async function ListsSettingsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/settings/profile");
  const profile = await getOwnProfile(user.uid);
  redirect(profile.handle ? `/u/${profile.handle}` : "/settings/profile");
}