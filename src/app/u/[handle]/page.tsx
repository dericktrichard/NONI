import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { getProfileByHandle } from "@/lib/data/profile";

export const revalidate = 300;

const load = cache(getProfileByHandle);

type Props = { params: Promise<{ handle: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params;
  const profile = await load(handle);
  if (!profile) return { title: "Profile not found" };
  return { title: `@${profile.handle}`, description: profile.bio || `@${profile.handle} on NONI` };
}

export default async function ProfilePage({ params }: Props) {
  const { handle } = await params;
  const profile = await load(handle);
  if (!profile) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 pt-8 pb-24">
      <p className="eyebrow">Profile</p>
      <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight sm:text-6xl">@{profile.handle}</h1>
      {profile.bio ? <p className="mt-4 max-w-xl whitespace-pre-line text-sm">{profile.bio}</p> : null}

      <dl className="mt-8 grid grid-cols-2 gap-px border bg-border sm:max-w-md">
        <div className="bg-background p-4">
          <dt className="eyebrow">Member since</dt>
          <dd className="mt-1 font-display text-xl font-semibold">{profile.createdAt.slice(0, 10) || "--"}</dd>
        </div>
        <div className="bg-background p-4">
          <dt className="eyebrow">Feats submitted</dt>
          <dd className="tabular mt-1 font-display text-xl font-semibold">{profile.featsSubmitted}</dd>
        </div>
      </dl>

      {profile.lists.length > 0 ? (
        <section className="mt-12">
          <h2 className="eyebrow">Lists</h2>
          <div className="mt-4 space-y-10">
            {profile.lists.map((list) => (
              <article key={list.id}>
                <h3 className="font-display text-2xl font-semibold tracking-tight">{list.title}</h3>
                <ol className="mt-4 border-t">
                  {list.items.map((item, index) => (
                    <li key={item.characterId} className="grid grid-cols-[2rem_1fr] gap-3 border-b py-4">
                      <span className="tabular text-sm text-muted-foreground">{index + 1}</span>
                      <div>
                        <Link
                          href={`/characters/${item.characterId}`}
                          className="font-medium underline underline-offset-4"
                        >
                          {item.name}
                        </Link>
                        <p className="mt-1 whitespace-pre-line text-sm">{item.reason}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}