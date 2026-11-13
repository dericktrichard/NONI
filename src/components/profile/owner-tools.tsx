"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ListBuilder } from "@/components/lists/list-builder";
import { ProfileEditor } from "@/components/profile/profile-editor";
import { Modal } from "@/components/ui/modal";
import { useSession } from "@/hooks/use-session";
import { signOutEverywhere } from "@/lib/auth/client";
import type { UserList } from "@/lib/data/lists";
import type { OwnProfile } from "@/lib/data/profile";
import type { Look } from "@/lib/profile/look";
import { OPEN_LISTS } from "@/lib/ui/events";

interface OwnerToolsProps {
  profile: OwnProfile;
  look: Look;
  verified: boolean;
  staff: boolean;
  lists: UserList[];
}

export function OwnerTools({ profile, look, verified, staff, lists }: OwnerToolsProps) {
  const router = useRouter();
  const { refresh } = useSession();
  const [open, setOpen] = useState<"edit" | "lists" | null>(null);
  const [fresh, setFresh] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const close = () => {
    setOpen(null);
    setFresh(false);
  };

  useEffect(() => {
    const openNew = () => {
      setFresh(true);
      setOpen("lists");
    };
    window.addEventListener(OPEN_LISTS, openNew);
    return () => window.removeEventListener(OPEN_LISTS, openNew);
  }, []);

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
        <p className="border-foreground bg-muted mt-4 max-w-md border-l-2 p-3 text-sm">
          Your email is not verified. Open the link we emailed you, then sign in again.
          Voting and submitting need a verified email.
        </p>
      ) : null}

      <div className="mt-5 flex flex-wrap gap-2">
        <button
          type="button"
          className="btn btn-line btn-sm"
          onClick={() => setOpen("edit")}
        >
          Edit profile
        </button>
        <button
          type="button"
          className="btn btn-line btn-sm"
          onClick={() => {
            setFresh(false);
            setOpen("lists");
          }}
        >
          Edit lists
        </button>
        {staff ? (
          <Link href="/admin" className="btn btn-line btn-sm">
            Admin
          </Link>
        ) : null}
        <button
          type="button"
          className="btn btn-quiet btn-sm"
          onClick={() => void leave()}
          disabled={leaving}
        >
          Sign out
        </button>
      </div>

      <Modal
        wide
        open={open === "edit"}
        onClose={close}
        eyebrow="Profile"
        title="Edit profile"
      >
        <ProfileEditor
          profile={profile}
          look={look}
          verified={verified}
          onSaved={() => {
            close();
            void refresh();
          }}
        />
      </Modal>

      <Modal
        wide
        open={open === "lists"}
        onClose={close}
        eyebrow="Profile"
        title="Your lists"
      >
        <ListBuilder lists={lists} openNew={fresh} />
      </Modal>
    </>
  );
}
