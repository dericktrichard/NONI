"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { describeAuthError } from "@/lib/auth/errors";
import {
  requestPasswordReset,
  signInWithEmail,
  signInWithGoogle,
  signUpWithEmail,
} from "@/lib/auth/client";
import { emailSchema, signInSchema, signUpSchema } from "@/lib/validation/auth";

type Mode = "signin" | "signup";
type Message = { kind: "error" | "info"; text: string };

interface AuthDialogProps {
  open: boolean;
  onClose: () => void;
  onSignedIn: () => void | Promise<void>;
}

const inputClass = "h-11 w-full rounded-sm border bg-transparent px-3 text-sm outline-none focus:border-foreground";

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
      setMessage({ kind: "info", text: "If that account exists, a reset link is on its way." });
    } catch (error) {
      setMessage({ kind: "error", text: describeAuthError(error) });
    } finally {
      setBusy(false);
    }
  }

  const signup = mode === "signup";

  return (
    <dialog
      ref={ref}
      onClose={handleClose}
      aria-labelledby="auth-title"
      className="m-auto w-[calc(100%-2rem)] max-w-sm rounded-sm border bg-background p-6 text-foreground backdrop:bg-black/60"
    >
      <div className="flex items-start justify-between">
        <h2 id="auth-title" className="font-display text-xl font-semibold tracking-tight">
          {signup ? "Create account" : "Sign in"}
        </h2>
        <button
          type="button"
          onClick={() => ref.current?.close()}
          aria-label="Close"
          className="-m-2 p-2 hover:bg-muted"
        >
          <X className="size-5" />
        </button>
      </div>

      <Button
        variant="outline"
        className="mt-6 w-full"
        disabled={busy}
        onClick={() => void run(signInWithGoogle)}
      >
        Continue with Google
      </Button>

      <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-widest text-foreground/60">
        <span className="h-px flex-1 bg-foreground/20" />
        or
        <span className="h-px flex-1 bg-foreground/20" />
      </div>

      <form onSubmit={submit} className="space-y-4">
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            maxLength={254}
            required
            className={inputClass}
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={signup ? "new-password" : "current-password"}
            maxLength={128}
            required
            className={inputClass}
          />
          {signup && <span className="mt-1 block text-xs text-foreground/60">At least 10 characters.</span>}
        </label>

        {message && (
          <p role="alert" className={message.kind === "error" ? "text-sm font-medium" : "text-sm text-foreground/70"}>
            {message.text}
          </p>
        )}

        <Button type="submit" variant="primary" className="w-full" disabled={busy}>
          {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
          {signup ? "Create account" : "Sign in"}
        </Button>
      </form>

      <div className="mt-5 flex items-center justify-between text-sm">
        <button
          type="button"
          className="underline underline-offset-4"
          onClick={() => {
            setMode(signup ? "signin" : "signup");
            setMessage(null);
          }}
        >
          {signup ? "Have an account? Sign in" : "New here? Create account"}
        </button>
        {!signup && (
          <button type="button" className="underline underline-offset-4" onClick={() => void reset()} disabled={busy}>
            Forgot password
          </button>
        )}
      </div>
    </dialog>
  );
}