"use client";

import { useState } from "react";
import { LookForm } from "@/components/profile/look-form";
import { ProfileForm } from "@/components/profile/profile-form";
import type { OwnProfile } from "@/lib/data/profile";
import type { Look } from "@/lib/profile/look";
import { cn } from "@/lib/utils";

const TABS = [
  { key: "details", label: "Details" },
  { key: "avatar", label: "Avatar" },
  { key: "banner", label: "Banner" },
] as const;

type Tab = (typeof TABS)[number]["key"];

interface ProfileEditorProps {
  profile: OwnProfile;
  look: Look;
  verified: boolean;
  onSaved: () => void;
}

export function ProfileEditor({ profile, look, verified, onSaved }: ProfileEditorProps) {
  const [tab, setTab] = useState<Tab>("details");

  return (
    <div>
      <div role="group" aria-label="What to edit" className="mb-6 flex border-b">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            aria-pressed={tab === key}
            onClick={() => setTab(key)}
            className={cn(
              "hover:bg-muted h-11 border-b-2 border-transparent px-4 text-sm font-medium transition-colors",
              tab === key && "border-b-accent",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className={cn(tab !== "details" && "hidden")}>
        <ProfileForm initial={profile} verified={verified} onSaved={onSaved} />
      </div>
      <div className={cn(tab === "details" && "hidden")}>
        <LookForm
          initial={look}
          handle={profile.handle ?? "you"}
          section={tab === "banner" ? "banner" : "avatar"}
          onSaved={onSaved}
        />
      </div>
    </div>
  );
}
