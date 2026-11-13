"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CharacterFinder } from "@/components/characters/character-finder";
import { ProfileAvatar } from "@/components/profile/banner";
import { ProfileForm } from "@/components/profile/profile-form";
import { StandingToggle } from "@/components/standing/standing-toggle";
import { Modal } from "@/components/ui/modal";
import type { SessionUser } from "@/hooks/use-session";
import { OPEN_SIGN_IN } from "@/lib/auth/events";
import { GLAZE } from "@/lib/glaze/rules";
import { DEFAULT_THEME } from "@/lib/profile/look";
import { cn } from "@/lib/utils";
import type { CharacterSummary } from "@/types/character";

const STEPS = [
  { key: "handle", title: "Choose your handle" },
  { key: "avatar", title: "Pick your avatar" },
  { key: "ready", title: "You are all set" },
] as const;

type Step = (typeof STEPS)[number]["key"];

const NEXT = [
  {
    href: "/battle",
    title: "Battle",
    text: "Team fights and tournaments. Risk Glaze or play free.",
  },
  {
    href: "/play",
    title: "Play",
    text: "Higher or lower, matchups and the leaderboard.",
  },
  { href: "/", title: "Explore", text: "Browse rankings and add feats with proof." },
];

function Progress({ index }: { index: number }) {
  return (
    <ol className="mb-5 flex gap-1.5" aria-label="Progress">
      {STEPS.map((step, i) => (
        <li
          key={step.key}
          aria-current={i === index ? "step" : undefined}
          className={cn(
            "h-1 flex-1",
            i < index ? "bg-foreground" : i === index ? "bg-accent" : "bg-muted",
          )}
        />
      ))}
    </ol>
  );
}

interface AvatarStepProps {
  user: SessionUser;
  refresh: () => Promise<void>;
  onNext: () => void;
}

function AvatarStep({ user, refresh, onNext }: AvatarStepProps) {
  const router = useRouter();
  const [pick, setPick] = useState<CharacterSummary | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    if (!pick) return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/profile/look", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          avatarId: pick.id,
          bannerTheme: DEFAULT_THEME,
          bannerId: null,
        }),
      });
      if (response.status === 401) {
        window.dispatchEvent(new Event(OPEN_SIGN_IN));
        setError("Sign in to save your avatar.");
        return;
      }
      if (response.ok) {
        await refresh();
        router.refresh();
        onNext();
        return;
      }
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(data?.error ?? "Could not save your avatar.");
    } catch {
      setError("Network error. Try again.");
    } finally {
      setBusy(false);
    }
  }

  const look = {
    avatarId: pick?.id ?? null,
    avatarName: pick?.name ?? null,
    avatarUrl: pick?.imageUrl ?? null,
    bannerTheme: DEFAULT_THEME,
    bannerId: null,
    bannerUrl: null,
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4">
        <ProfileAvatar
          look={look}
          handle={user.handle ?? "?"}
          className="size-16 shrink-0"
        />
        <div className="min-w-0">
          <p className="font-display truncate text-lg font-semibold">@{user.handle}</p>
          <p className="text-muted-foreground text-sm">
            {pick ? pick.name : "Choose a character to represent you."}
          </p>
        </div>
      </div>

      <CharacterFinder
        key="avatar"
        label="Search a character portrait"
        needArt
        onPick={setPick}
      />

      {error ? (
        <p role="alert" className="text-sm font-medium">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2 border-t pt-5">
        <button
          type="button"
          className="btn btn-solid"
          disabled={!pick || busy}
          onClick={() => void save()}
        >
          Save and continue
        </button>
        <button type="button" className="btn btn-quiet" disabled={busy} onClick={onNext}>
          Skip for now
        </button>
      </div>
    </div>
  );
}

function ReadyStep({ onDone }: { onDone: () => void }) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4 border p-4">
        <span className="tabular font-display text-4xl leading-none font-semibold">
          {GLAZE.start}
        </span>
        <div>
          <p className="eyebrow">Starting Glaze</p>
          <p className="text-muted-foreground mt-1 text-sm">
            Earn more with the daily claim and practice wins, or stake it in battles. It
            has no cash value.
          </p>
        </div>
      </div>

      <ul className="bg-border grid gap-px border sm:grid-cols-3">
        {NEXT.map((item) => (
          <li key={item.href} className="bg-background">
            <Link
              href={item.href}
              onClick={onDone}
              className="hover:bg-muted block h-full p-3 transition-colors"
            >
              <span className="font-display text-base font-semibold">{item.title}</span>
              <span className="text-muted-foreground mt-1 block text-xs">
                {item.text}
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <div className="border p-4">
        <p className="eyebrow mb-3">Optional</p>
        <StandingToggle initial={false} />
      </div>

      <button type="button" className="btn btn-solid w-full" onClick={onDone}>
        Start exploring
      </button>
    </div>
  );
}

interface OnboardingProps {
  open: boolean;
  user: SessionUser | null;
  onClose: () => void;
  onSignOut: () => void;
  refresh: () => Promise<void>;
}

export function Onboarding({ open, user, onClose, onSignOut, refresh }: OnboardingProps) {
  const [chosen, setChosen] = useState<Step | null>(null);
  const step: Step =
    chosen ?? (!user?.handle ? "handle" : !user.avatarUrl ? "avatar" : "ready");
  const index = STEPS.findIndex((item) => item.key === step);

  const close = () => {
    setChosen(null);
    onClose();
  };

  return (
    <Modal
      open={open && user !== null}
      onClose={close}
      eyebrow={`Step ${index + 1} of ${STEPS.length}`}
      title={STEPS[index]!.title}
    >
      {user ? (
        <>
          <Progress index={index} />
          {step === "handle" ? (
            <>
              <p className="text-muted-foreground mb-5 text-sm">
                This is your public name on NONI. Your profile page and lists live at it.
              </p>
              <ProfileForm
                initial={{ handle: null, bio: "", cooldownDays: 0, private: false }}
                verified={user.verified}
                onSaved={() => {
                  setChosen("avatar");
                  void refresh();
                }}
              />
              <button
                type="button"
                className="btn btn-quiet btn-sm mt-4"
                onClick={onSignOut}
              >
                Sign out
              </button>
            </>
          ) : step === "avatar" ? (
            <AvatarStep user={user} refresh={refresh} onNext={() => setChosen("ready")} />
          ) : (
            <ReadyStep onDone={close} />
          )}
        </>
      ) : null}
    </Modal>
  );
}
