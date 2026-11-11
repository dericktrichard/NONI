"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CharacterFinder } from "@/components/characters/character-finder";
import { BannerSurface, ProfileAvatar, ProfileBanner } from "@/components/profile/banner";
import { ImageUpload } from "@/components/profile/image-upload";
import { OPEN_SIGN_IN } from "@/lib/auth/events";
import {
  BANNER_THEMES,
  THEME_LABELS,
  type BannerTheme,
  type Look,
} from "@/lib/profile/look";
import { cn } from "@/lib/utils";
import type { CharacterSummary } from "@/types/character";

interface LookFormProps {
  initial: Look;
  handle: string;
  section: "avatar" | "banner";
  onSaved?: () => void;
}

export function LookForm({ initial, handle, section, onSaved }: LookFormProps) {
  const router = useRouter();
  const [look, setLook] = useState<Look>(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pickAvatar = (c: CharacterSummary) =>
    setLook((current) => ({
      ...current,
      avatarId: c.id,
      avatarName: c.name,
      avatarUrl: c.imageUrl,
    }));
  const uploadAvatar = (url: string) =>
    setLook((current) => ({
      ...current,
      avatarId: null,
      avatarName: null,
      avatarUrl: url,
    }));
  const clearAvatar = () =>
    setLook((current) => ({
      ...current,
      avatarId: null,
      avatarName: null,
      avatarUrl: null,
    }));
  const pickArt = (c: CharacterSummary) =>
    setLook((current) => ({ ...current, bannerId: c.id, bannerUrl: c.imageUrl }));
  const uploadBanner = (url: string) =>
    setLook((current) => ({ ...current, bannerId: null, bannerUrl: url }));
  const clearArt = () =>
    setLook((current) => ({ ...current, bannerId: null, bannerUrl: null }));
  const pickTheme = (theme: BannerTheme) =>
    setLook((current) => ({
      ...current,
      bannerTheme: theme,
      bannerId: null,
      bannerUrl: null,
    }));

  async function save() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/profile/look", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          avatarId: look.avatarId,
          bannerTheme: look.bannerTheme,
          bannerId: look.bannerId,
          avatarUpload: look.avatarId === null && look.avatarUrl !== null,
          bannerUpload: look.bannerId === null && look.bannerUrl !== null,
        }),
      });
      if (response.status === 401) {
        window.dispatchEvent(new Event(OPEN_SIGN_IN));
        setError("Sign in to save your appearance.");
        return;
      }
      if (response.ok) {
        onSaved?.();
        router.refresh();
        return;
      }
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(data?.error ?? "Could not save your appearance.");
    } catch {
      setError("Network error. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <ProfileBanner look={look} className="h-24 sm:h-32" />
        <ProfileAvatar
          look={look}
          handle={handle}
          className="-mt-8 ml-4 size-16 sm:-mt-10 sm:size-20"
        />
      </div>

      {section === "avatar" ? (
        <div className="space-y-5">
          <div className="border p-3">
            <p className="eyebrow mb-2">Your own picture</p>
            <ImageUpload kind="avatar" onUploaded={uploadAvatar} />
          </div>
          <CharacterFinder
            key="avatar"
            label="Or pick a character portrait"
            needArt
            onPick={pickAvatar}
          />
          {look.avatarUrl ? (
            <button type="button" className="btn btn-quiet btn-sm" onClick={clearAvatar}>
              Remove avatar
            </button>
          ) : null}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="border p-3">
            <p className="eyebrow mb-2">Your own banner</p>
            <ImageUpload kind="banner" onUploaded={uploadBanner} />
          </div>

          <div>
            <p className="eyebrow mb-2">Or a pattern</p>
            <ul className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {BANNER_THEMES.map((theme) => {
                const active = look.bannerUrl === null && look.bannerTheme === theme;
                return (
                  <li key={theme}>
                    <button
                      type="button"
                      aria-pressed={active}
                      onClick={() => pickTheme(theme)}
                      className={cn(
                        "block w-full border-b-2 border-transparent text-left transition-colors",
                        active && "border-b-accent",
                      )}
                    >
                      <BannerSurface theme={theme} className="h-12 w-full" />
                      <span className="eyebrow mt-1 block">{THEME_LABELS[theme]}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          <CharacterFinder
            key="banner"
            label="Or use a character's art"
            needArt
            onPick={pickArt}
          />
          {look.bannerUrl ? (
            <button type="button" className="btn btn-quiet btn-sm" onClick={clearArt}>
              Remove banner image
            </button>
          ) : null}
        </div>
      )}

      {error ? (
        <p role="alert" className="text-sm font-medium">
          {error}
        </p>
      ) : null}

      <div className="border-t pt-5">
        <button
          type="button"
          className="btn btn-solid"
          disabled={busy}
          onClick={() => void save()}
        >
          Save {section}
        </button>
      </div>
    </div>
  );
}
