"use client";

import { useEffect, useSyncExternalStore } from "react";

type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
};

let deferred: InstallEvent | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((listener) => listener());

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferred = event as InstallEvent;
    emit();
  });
  window.addEventListener("appinstalled", () => {
    deferred = null;
    emit();
  });
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

type Mode = "prompt" | "ios" | "none";

function snapshot(): Mode {
  if (deferred) return "prompt";
  const standalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as { standalone?: boolean }).standalone === true;
  return !standalone && /iphone|ipad|ipod/i.test(navigator.userAgent) ? "ios" : "none";
}

export function PwaRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    void navigator.serviceWorker.register("/sw.js").catch(() => undefined);
  }, []);
  return null;
}

export function InstallButton() {
  const mode = useSyncExternalStore(subscribe, snapshot, () => "none" as Mode);

  async function install() {
    const event = deferred;
    if (!event) return;
    await event.prompt();
    await event.userChoice;
    deferred = null;
    emit();
  }

  if (mode === "prompt") {
    return (
      <button
        type="button"
        className="btn btn-line btn-sm"
        onClick={() => void install()}
      >
        Install app
      </button>
    );
  }
  if (mode === "ios")
    return <p className="text-xs">To install, tap Share, then Add to Home Screen.</p>;
  return null;
}
