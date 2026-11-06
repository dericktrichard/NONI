"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ListsManager } from "@/components/lists/lists-manager";
import { ProfileForm } from "@/components/profile/profile-form";
import { Modal } from "@/components/ui/modal";
import { useSession } from "@/hooks/use-session";
import { signOutEverywhere } from "@/lib/auth/client";
import type { CharacterOption, UserList } from "@/lib/data/lists";
import type { OwnProfile } from "@/lib/data/profile";

interface OwnerToolsProps {
  profile: OwnProfile;
  verified: boolean;
  staff: boolean;
  lists: UserList[];
  options: CharacterOption[];
}

export function OwnerTools({ profile, verified, staff, lists, options }: OwnerToolsProps) {
  const router = useRouter();
  const { refresh } = useSession();
  const [open, setOpen] = useState<"profile" | "lists" | null>(null);
  const [leaving, setLeaving] = useState(false);
  const close = () => setOpen(null);

  async function leave() {
    setLeaving(true);
    try {
      await signOutEverywhere();
    } finally {
      await refresh();
      router.push("/");
      router.refresh();
    }
  }

  return (
    <>
      {!verified ? (
        <p className="mt-4 max-w-md border-l-2 border-foreground bg-muted p-3 text-sm">
          Your email is not verified. Open the link we emailed you, then sign in again. Voting and submitting need a
          verified email.
        </p>
      ) : null}

      <div className="mt-5 flex flex-wrap gap-2">
        <button type="button" className="btn btn-line btn-sm" onClick={() => setOpen("profile")}>
          Edit profile
        </button>
        <button type="button" className="btn btn-line btn-sm" onClick={() => setOpen("lists")}>
          Edit lists
        </button>
        {staff ? (
          <Link href="/admin" className="btn btn-line btn-sm">
            Admin
          </Link>
        ) : null}
        <button type="button" className="btn btn-quiet btn-sm" onClick={() => void leave()} disabled={leaving}>
          Sign out
        </button>
      </div>

      <Modal open={open === "profile"} onClose={close} eyebrow="Profile" title="Edit your profile">
        <ProfileForm
          initial={profile}
          verified={verified}
          onSaved={() => {
            close();
            void refresh();
          }}
        />
      </Modal>

      <Modal wide open={open === "lists"} onClose={close} eyebrow="Profile" title="Your lists">
        <ListsManager lists={lists} options={options} />
      </Modal>
    </>
  );
}