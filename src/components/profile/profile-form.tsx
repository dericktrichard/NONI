"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { controlClass } from "@/components/ui/fields";
import { OPEN_SIGN_IN } from "@/lib/auth/events";
import type { OwnProfile } from "@/lib/data/profile";
import {
  HANDLE_MAX,
  HANDLE_MESSAGES,
  checkHandle,
  normalizeHandle,
} from "@/lib/profile/handle";

interface ProfileFormProps {
  initial: OwnProfile;
  verified: boolean;
  onSaved?: () => void;
}

export function ProfileForm({ initial, verified, onSaved }: ProfileFormProps) {
  const router = useRouter();
  const [handle, setHandle] = useState(initial.handle ?? "");
  const [bio, setBio] = useState(initial.bio);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const normalized = normalizeHandle(handle);
  const issue = normalized === "" ? null : checkHandle(normalized);
  const locked =
    initial.handle !== null && initial.cooldownDays > 0 && normalized !== initial.handle;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (checkHandle(normalized) !== null) {
      setError("Choose a valid handle.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ handle: normalized, bio: bio.trim() }),
      });
      if (response.status === 401) {
        window.dispatchEvent(new Event(OPEN_SIGN_IN));
        setError("Sign in to save your profile.");
        return;
      }
      const data = (await response.json().catch(() => null)) as {
        handle?: string;
        error?: string;
      } | null;
      if (response.ok && data?.handle) {
        onSaved?.();
        router.replace(`/u/${data.handle}`);
        router.refresh();
        return;
      }
      setError(data?.error ?? "Could not save your profile.");
    } catch {
      setError("Network error. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      {!verified ? (
        <p className="border-foreground bg-muted border-l-2 p-3 text-sm">
          Verify your email and sign in again before saving your profile.
        </p>
      ) : null}

      <label className="block text-sm">
        <span className="eyebrow mb-1 block">Handle</span>
        <div className="flex items-stretch">
          <span className="bg-muted text-muted-foreground grid w-11 place-items-center border border-r-0">
            @
          </span>
          <input
            value={handle}
            onChange={(event) => setHandle(event.target.value)}
            maxLength={HANDLE_MAX + 1}
            autoComplete="off"
            spellCheck={false}
            required
            className={controlClass}
          />
        </div>
        {issue ? (
          <span className="text-muted-foreground mt-1 block">
            {HANDLE_MESSAGES[issue]}
          </span>
        ) : null}
        {locked ? (
          <span className="text-muted-foreground mt-1 block">
            You can change your handle again in {initial.cooldownDays}{" "}
            {initial.cooldownDays === 1 ? "day" : "days"}.
          </span>
        ) : null}
      </label>

      <label className="block text-sm">
        <span className="eyebrow mb-1 flex justify-between">
          <span>Bio</span>
          <span className="tabular">{bio.length} / 200</span>
        </span>
        <textarea
          value={bio}
          onChange={(event) => setBio(event.target.value)}
          maxLength={200}
          rows={3}
          className={`${controlClass} h-auto py-2`}
        />
      </label>

      {error ? (
        <p role="alert" className="text-sm font-medium">
          {error}
        </p>
      ) : null}

      <div className="border-t pt-5">
        <button
          type="submit"
          className="btn btn-solid"
          disabled={busy || issue !== null || normalized === "" || locked}
        >
          Save profile
        </button>
      </div>
    </form>
  );
}
