"use client";

import { Button } from "@/components/ui/button";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto max-w-6xl px-4 py-24">
      <p className="eyebrow">Something went wrong</p>
      <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-5xl">
        This page did not load.
      </h1>
      <p className="mt-4 max-w-xl text-muted-foreground">
        The rankings could not be read right now. Nothing you did caused this. Try again in a moment.
      </p>
      <Button className="mt-6" variant="primary" size="lg" onClick={reset}>
        Try again
      </Button>
    </main>
  );
}
