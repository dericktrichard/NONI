"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, X } from "lucide-react";
import { controlClass } from "@/components/ui/fields";
import { describeAuthError } from "@/lib/auth/errors";
import {
  requestPasswordReset,
  signInWithEmail,
  signInWithGoogle,
  signUpWithEmail,
} from "@/lib/auth/client";
import { cn } from "@/lib/utils";
import { emailSchema, signInSchema, signUpSchema } from "@/lib/validation/auth";

type Mode = "signin" | "signup";
type Message = { kind: "error" | "info"; text: string };

interface AuthDialogProps {
  open: boolean;
  onClose: () => void;
  onSignedIn: () => void | Promise<void>;
}

export function AuthDialog({ open, onClose, onSignedIn }: AuthDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<Message | null>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  function handleClose() {
    setPassword("");
    setMessage(null);
    setBusy(false);
    onClose();
  }

  async function run(task: () => Promise<void>) {
    setBusy(true);
    setMessage(null);
    try {
      await task();
      await onSignedIn();
    } catch (error) {
      const text = describeAuthError(error);
      if (text) setMessage({ kind: "error", text });
    } finally {
      setBusy(false);
    }
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const schema = mode === "signin" ? signInSchema : signUpSchema;
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) {
      setMessage({
        kind: "error",
        text:
          mode === "signin"
            ? "Enter a valid email and your password."
            : "Use a valid email and a password of 10 to 128 characters.",
      });
      return;
    }
    const { email: cleanEmail, password: cleanPassword } = parsed.data;
    void run(() =>
      mode === "signin"
        ? signInWithEmail(cleanEmail, cleanPassword)
        : signUpWithEmail(cleanEmail, cleanPassword),
    );
  }

  async function reset() {
    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) {
      setMessage({ kind: "error", text: "Enter your email first." });
      return;
    }
    setBusy(true);
    try {
      await requestPasswordReset(parsed.data);
      setMessage({
        kind: "info",
        text: "If that account exists, a reset link is on its way.",
      });
    } catch (error) {
      setMessage({ kind: "error", text: describeAuthError(error) });
    } finally {
      setBusy(false);
    }
  }

  function switchMode(next: Mode) {
    setMode(next);
    setMessage(null);
  }

  const signup = mode === "signup";

  return (
    <dialog
      ref={ref}
      onClose={handleClose}
      aria-labelledby="auth-title"
      className="bg-background text-foreground m-auto w-[calc(100%-2rem)] max-w-sm border p-0 backdrop:bg-black/60 backdrop:backdrop-blur-sm"
    >
      <div className="flex items-center justify-between border-b pl-5">
        <p className="eyebrow">Account</p>
        <button
          type="button"
          onClick={() => ref.current?.close()}
          aria-label="Close"
          className="hover:bg-muted grid size-11 place-items-center"
        >
          <X className="size-5" />
        </button>
      </div>

      <div className="p-5">
        <div
          className="grid grid-cols-2 border"
          role="group"
          aria-label="Choose an option"
        >
          {(
            [
              ["signin", "Sign in"],
              ["signup", "Create account"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              aria-pressed={mode === value}
              onClick={() => switchMode(value)}
              className={cn(
                "min-h-10 text-sm font-medium transition-colors",
                mode === value ? "bg-foreground text-background" : "hover:bg-muted",
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <h2
          id="auth-title"
          className="font-display mt-6 text-2xl font-semibold tracking-tight"
        >
          {signup ? "Join NONI" : "Welcome back"}
        </h2>
        <p className="text-muted-foreground mt-1 text-sm">
          {signup
            ? "Verified accounts can submit feats, vote and make lists."
            : "Sign in to submit feats, vote and make lists."}
        </p>

        <button
          type="button"
          className="btn btn-line mt-5 w-full"
          disabled={busy}
          onClick={() => void run(signInWithGoogle)}
        >
          Continue with Google
        </button>

        <div className="text-foreground/60 my-5 flex items-center gap-3 text-xs tracking-widest uppercase">
          <span className="bg-foreground/20 h-px flex-1" />
          or
          <span className="bg-foreground/20 h-px flex-1" />
        </div>

        <form onSubmit={submit} className="space-y-4">
          <label className="block text-sm">
            <span className="eyebrow mb-1 block">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              maxLength={254}
              required
              className={controlClass}
            />
          </label>
          <label className="block text-sm">
            <span className="eyebrow mb-1 block">Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={signup ? "new-password" : "current-password"}
              maxLength={128}
              required
              className={controlClass}
            />
            {signup ? (
              <span className="text-muted-foreground mt-1 block text-xs">
                At least 10 characters.
              </span>
            ) : null}
          </label>

          {message ? (
            <p
              role="alert"
              className={
                message.kind === "error"
                  ? "text-sm font-medium"
                  : "text-muted-foreground text-sm"
              }
            >
              {message.text}
            </p>
          ) : null}

          <button type="submit" className="btn btn-solid w-full" disabled={busy}>
            {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
            {signup ? "Create account" : "Sign in"}
          </button>
        </form>

        {!signup ? (
          <button
            type="button"
            className="mt-4 min-h-11 text-sm underline underline-offset-4"
            onClick={() => void reset()}
            disabled={busy}
          >
            Forgot password
          </button>
        ) : null}
      </div>
    </dialog>
  );
}
