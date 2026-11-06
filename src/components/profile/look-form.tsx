"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Portrait } from "@/components/characters/portrait";
import { BannerSurface, ProfileAvatar, ProfileBanner } from "@/components/profile/banner";
import { useCharacterSearch } from "@/hooks/use-character-search";
import { OPEN_SIGN_IN } from "@/lib/auth/events";
import { BANNER_THEMES, THEME_LABELS, type BannerTheme, type Look } from "@/lib/profile/look";
import { cn } from "@/lib/utils";
import type { CharacterSummary } from "@/types/character";

interface LookFormProps {
  initial: Look;
  handle: string;
  onSaved?: () => void;
}

type Tab = "avatar" | "banner";

function Finder({ label, onPick }: { label: string; onPick: (character: CharacterSummary) => void }) {
  const { text, change, results, list, failed } = useCharacterSearch(10);
  const shown = list.filter((item) => item.imageUrl !== null);

  return (
    <div>
      <label className="block">
        <span className="eyebrow mb-1 block">{label}</span>
        <input
          value={text}
          onChange={(event) => change(event.target.value)}
          maxLength={60}
          placeholder="Name or verse"
          autoComplete="off"
          spellCheck={false}
          className="h-11 w-full border bg-background px-3 text-sm outline-none placeholder:text-muted-foreground focus:border-foreground"
        />
      </label>

      <p className="eyebrow mt-3 mb-2">{results ? "Results" : "Top ranked"}</p>
      {results && shown.length === 0 ? (
        <p className="border p-3 text-sm text-muted-foreground">
          {failed ? "Search is unavailable right now." : "No character with art matches that."}
        </p>
      ) : (
        <ul className="grid max-h-64 grid-cols-3 gap-2 overflow-y-auto border p-2 sm:grid-cols-5">
          {shown.map((c) => (
            <li key={c.id}>
              <button type="button" onClick={() => onPick(c)} className="group block w-full text-left">
                <Portrait name={c.name} src={c.imageUrl} sizes="96px" className="aspect-2/3 w-full" />
                <span className="mt-1 block truncate text-xs font-medium group-hover:underline">{c.name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function LookForm({ initial, handle, onSaved }: LookFormProps) {
  const router = useRouter();
  const [look, setLook] = useState<Look>(initial);
  const [tab, setTab] = useState<Tab>("avatar");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pickAvatar = (c: CharacterSummary) =>
    setLook((current) => ({ ...current, avatarId: c.id, avatarName: c.name, avatarUrl: c.imageUrl }));
  const clearAvatar = () => setLook((current) => ({ ...current, avatarId: null, avatarName: null, avatarUrl: null }));
  const pickArt = (c: CharacterSummary) => setLook((current) => ({ ...current, bannerId: c.id, bannerUrl: c.imageUrl }));
  const clearArt = () => setLook((current) => ({ ...current, bannerId: null, bannerUrl: null }));
  const pickTheme = (theme: BannerTheme) =>
    setLook((current) => ({ ...current, bannerTheme: theme, bannerId: null, bannerUrl: null }));

  async function save() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/profile/look", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ avatarId: look.avatarId, bannerTheme: look.bannerTheme, bannerId: look.bannerId }),
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
        <ProfileAvatar look={look} handle={handle} className="-mt-8 ml-4 size-16 sm:-mt-10 sm:size-20" />
      </div>

      <div role="group" aria-label="What to change" className="flex border-b">
        {(["avatar", "banner"] as const).map((key) => (
          <button
            key={key}
            type="button"
            aria-pressed={tab === key}
            onClick={() => setTab(key)}
            className={cn(
              "h-10 border-b-2 border-transparent px-4 text-sm font-medium capitalize transition-colors hover:bg-muted",
              tab === key && "border-b-accent",
            )}
          >
            {key}
          </button>
        ))}
      </div>

      {tab === "avatar" ? (
        <div className="space-y-4">
          <Finder key="avatar" label="Pick a character portrait" onPick={pickAvatar} />
          {look.avatarId ? (
            <button type="button" className="btn btn-quiet btn-sm" onClick={clearAvatar}>
              Remove avatar
            </button>
          ) : null}
        </div>
      ) : (
        <div className="space-y-6">
          <div>
            <p className="eyebrow mb-2">Pattern</p>
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

          <Finder key="banner" label="Or use a character's art" onPick={pickArt} />
          {look.bannerId ? (
            <button type="button" className="btn btn-quiet btn-sm" onClick={clearArt}>
              Remove art
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
        <button type="button" className="btn btn-solid" disabled={busy} onClick={() => void save()}>
          Save appearance
        </button>
      </div>
    </div>
  );
}