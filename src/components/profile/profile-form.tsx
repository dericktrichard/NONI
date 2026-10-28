"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { controlClass } from "@/components/ui/fields";
import { OPEN_SIGN_IN } from "@/lib/auth/events";
import type { OwnProfile } from "@/lib/data/profile";
import { HANDLE_MAX, HANDLE_MESSAGES, checkHandle, normalizeHandle } from "@/lib/profile/handle";

interface ProfileFormProps {
  initial: OwnProfile;
  verified: boolean;
}

export function ProfileForm({ initial, verified }: ProfileFormProps) {
  const [handle, setHandle] = useState(initial.handle ?? "");
  const [bio, setBio] = useState(initial.bio);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(initial.handle);

  const normalized = normalizeHandle(handle);
  const issue = normalized === "" ? null : checkHandle(normalized);
  const locked = saved !== null && initial.cooldownDays > 0 && normalized !== saved;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (checkHandle(normalized) !== null) {
      setError("Choose a valid handle.");
      return;
    }
    setBusy(true);
    setError(null);
    setMessage(null);
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
      const data = (await response.json().catch(() => null)) as { handle?: string; error?: string } | null;
      if (response.ok && data?.handle) {
        setSaved(data.handle);
        setHandle(data.handle);
        setMessage("Saved.");
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
    <form onSubmit={submit} className="mt-8 max-w-xl space-y-6">
      {!verified ? (
        <p className="border p-3 text-sm">Verify your email and sign in again before saving your profile.</p>
      ) : null}

      <label className="block text-sm">
        <span className="mb-1 block font-medium">Handle</span>
        <div className="flex items-center">
          <span className="grid h-11 place-items-center border border-r-0 px-3 text-muted-foreground">@</span>
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
        {issue ? <span className="mt-1 block text-foreground/70">{HANDLE_MESSAGES[issue]}</span> : null}
        {locked ? (
          <span className="mt-1 block text-foreground/70">
            You can change your handle again in {initial.cooldownDays} {initial.cooldownDays === 1 ? "day" : "days"}.
          </span>
        ) : null}
      </label>

      <label className="block text-sm">
        <span className="mb-1 block font-medium">Bio (up to 200 characters)</span>
        <textarea
          value={bio}
          onChange={(event) => setBio(event.target.value)}
          maxLength={200}
          rows={3}
          className={`${controlClass} h-auto py-2`}
        />
      </label>

      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" variant="primary" disabled={busy || issue !== null || normalized === "" || locked}>
          Save profile
        </Button>
        {message && saved ? (
          <p role="status" className="text-sm">
            {message}{" "}
            <Link href={`/u/${saved}`} className="underline underline-offset-4">
              View your page
            </Link>
          </p>
        ) : null}
      </div>

      {error ? (
        <p role="alert" className="text-sm font-medium">
          {error}
        </p>
      ) : null}
    </form>
  );
}