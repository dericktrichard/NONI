import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-24">
      <div className="border p-6 sm:p-10">
        <p className="eyebrow">Error 404</p>
        <h1 className="font-display mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">
          Nothing here.
        </h1>
        <p className="text-muted-foreground mt-4 max-w-md">
          This page does not exist, or the character or profile was removed.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/" className="btn btn-solid">
            Back to Explore
          </Link>
          <Link href="/matchups" className="btn btn-line">
            Browse matchups
          </Link>
        </div>
      </div>
    </main>
  );
}
