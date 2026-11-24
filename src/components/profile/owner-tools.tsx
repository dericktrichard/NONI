"use client";

import { Pencil, Settings } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ListBuilder } from "@/components/lists/list-builder";
import { FlairShop } from "@/components/profile/flair-shop";
import { PlusPanel } from "@/components/profile/plus-panel";
import { ProfileEditor } from "@/components/profile/profile-editor";
import { StandingToggle } from "@/components/standing/standing-toggle";
import { Modal } from "@/components/ui/modal";
import { usePlus } from "@/hooks/use-plus";
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
  onBoards: boolean;
}

type Open = "settings" | "edit" | "lists" | "flair" | "signout" | null;

function Row({
  title,
  text,
  onClick,
}: {
  title: string;
  text: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="hover:bg-muted flex w-full items-center justify-between gap-4 border-b p-4 text-left transition-colors last:border-b-0"
    >
      <span className="min-w-0">
        <span className="block text-sm font-medium">{title}</span>
        <span className="text-muted-foreground block text-xs">{text}</span>
      </span>
      <span className="eyebrow shrink-0">Open</span>
    </button>
  );
}

export function OwnerTools({
  profile,
  look,
  verified,
  staff,
  lists,
  onBoards,
}: OwnerToolsProps) {
  const router = useRouter();
  const { refresh } = useSession();
  const [open, setOpen] = useState<Open>(null);
  const [fresh, setFresh] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [slot, setSlot] = useState<HTMLElement | null>(null);
  const plus = usePlus();

  /** Only closes when this window is still the open one, so moving between windows never clobbers the next */
  const closeIf = (key: Exclude<Open, null>) => () => {
    setOpen((current) => (current === key ? null : current));
    if (key === "lists") setFresh(false);
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
      await refresh();
      setOpen(null);
      router.push("/");
    } finally {
      setLeaving(false);
    }
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="Edit profile"
          className="btn btn-line btn-sm inline-flex items-center gap-2"
          onClick={() => setOpen("edit")}
        >
          <Pencil className="size-4" aria-hidden />
          <span className="hidden sm:inline">Edit profile</span>
        </button>
        <button
          type="button"
          aria-label="Settings"
          className="btn btn-line btn-sm inline-flex items-center gap-2"
          onClick={() => setOpen("settings")}
        >
          <Settings className="size-4" aria-hidden />
          <span className="hidden sm:inline">Settings</span>
        </button>
      </div>

      <Modal
        wide
        slim
        open={open === "settings"}
        onClose={closeIf("settings")}
        title="Account Settings"
        actions={
          plus ? null : (
            <button
              type="button"
              className="eyebrow border border-foreground bg-foreground px-2 py-1 text-background! hover:opacity-85 disabled:opacity-50"
              onClick={() =>
                document
                  .getElementById("plus-section")
                  ?.scrollIntoView({ behavior: "smooth", block: "start" })
              }
            >
              Go Plus
            </button>
          )
        }
      >
        <div className="space-y-8">
          <section aria-label="Your profile">
            <p className="eyebrow mb-2">Your profile</p>
            <div className="border">
              <Row
                title="Edit profile"
                text="Handle, bio, who can see you, avatar and banner."
                onClick={() => setOpen("edit")}
              />
              <Row
                title="Flair"
                text="Avatar frames and title lines, bought with Glaze."
                onClick={() => setOpen("flair")}
              />
              <Row
                title="Your lists"
                text="Create, edit and hide your lists."
                onClick={() => {
                  setFresh(false);
                  setOpen("lists");
                }}
              />
            </div>
          </section>

          <section aria-label="Leaderboards">
            <p className="eyebrow mb-2">Leaderboards</p>
            <div className="border p-4">
              <StandingToggle initial={onBoards} />
            </div>
          </section>

          <section id="plus-section" aria-label="NONI Plus">
            <PlusPanel />
          </section>

          <section
            aria-label="Account actions"
            className="flex flex-wrap items-center justify-between gap-2"
          >
            <div className="flex flex-wrap gap-2">
              {staff ? (
                <Link href="/admin" className="btn btn-line btn-sm">
                  Admin
                </Link>
              ) : null}
              <button
                type="button"
                className="btn btn-sm border-red-600! bg-red-600! text-white! hover:bg-red-700!"
                onClick={() => setOpen("signout")}
              >
                Sign out
              </button>
            </div>
          </section>

          {!verified ? (
            <p className="border-foreground bg-muted border-l-2 p-3 text-sm">
              Your email is not verified. Open the link we emailed you, then sign in
              again. Voting and submitting need a verified email.
            </p>
          ) : null}
        </div>
      </Modal>

      <Modal
        open={open === "signout"}
        onClose={closeIf("signout")}
        eyebrow="Account"
        title="Sign out?"
      >
        <p className="text-sm">You will need to sign in again to vote, battle or edit.</p>
        <div className="mt-6 flex flex-wrap gap-2">
          <button
            type="button"
            className="btn btn-sm border-red-600! bg-red-600! text-white! hover:bg-red-700!"
            onClick={() => void leave()}
            disabled={leaving}
          >
            {leaving ? "Signing out" : "Yes, sign out"}
          </button>
          <button
            type="button"
            className="btn btn-line btn-sm"
            onClick={() => setOpen("settings")}
            disabled={leaving}
          >
            Cancel
          </button>
        </div>
      </Modal>

      <Modal
        wide
        slim
        open={open === "edit"}
        onClose={closeIf("edit")}
        title="Edit Profile"
        actions={<span ref={setSlot} className="contents" />}
      >
        <ProfileEditor
          profile={profile}
          look={look}
          verified={verified}
          slot={slot}
          onSaved={() => {
            setOpen(null);
            void refresh();
          }}
        />
      </Modal>

      <Modal
        wide
        open={open === "lists"}
        onClose={closeIf("lists")}
        eyebrow="Profile"
        title="Your lists"
      >
        <ListBuilder lists={lists} openNew={fresh} />
      </Modal>

      <Modal
        wide
        open={open === "flair"}
        onClose={closeIf("flair")}
        eyebrow="Profile"
        title="Flair"
      >
        <FlairShop look={look} />
      </Modal>
    </>
  );
}
