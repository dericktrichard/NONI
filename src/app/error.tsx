"use client";

import Link from "next/link";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto max-w-3xl px-4 py-24">
      <div className="border p-6 sm:p-10">
        <p className="eyebrow">Something went wrong</p>
        <h1 className="font-display mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">
          This page did not load.
        </h1>
        <p className="text-muted-foreground mt-4 max-w-md">
          The rankings could not be read right now. Nothing you did caused this. Try again
          in a moment.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <button type="button" className="btn btn-solid" onClick={reset}>
            Try again
          </button>
          <Link href="/" className="btn btn-line">
            Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
