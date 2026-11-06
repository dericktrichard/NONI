"use client";

import { useState } from "react";
import { ListsManager } from "@/components/lists/lists-manager";
import { ProfileForm } from "@/components/profile/profile-form";
import { Modal } from "@/components/ui/modal";
import type { CharacterOption, UserList } from "@/lib/data/lists";
import type { OwnProfile } from "@/lib/data/profile";

interface OwnerToolsProps {
  profile: OwnProfile;
  verified: boolean;
  lists: UserList[];
  options: CharacterOption[];
}

export function OwnerTools({ profile, verified, lists, options }: OwnerToolsProps) {
  const [open, setOpen] = useState<"profile" | "lists" | null>(null);
  const close = () => setOpen(null);

  return (
    <>
      <div className="mt-5 flex flex-wrap gap-2">
        <button type="button" className="btn btn-line btn-sm" onClick={() => setOpen("profile")}>
          Edit profile
        </button>
        <button type="button" className="btn btn-line btn-sm" onClick={() => setOpen("lists")}>
          Edit lists
        </button>
      </div>

      <Modal open={open === "profile"} onClose={close} eyebrow="Profile" title="Edit your profile">
        <ProfileForm initial={profile} verified={verified} onSaved={close} />
      </Modal>

      <Modal wide open={open === "lists"} onClose={close} eyebrow="Profile" title="Your lists">
        <ListsManager lists={lists} options={options} />
      </Modal>
    </>
  );
}