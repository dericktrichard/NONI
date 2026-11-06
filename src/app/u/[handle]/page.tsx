import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { SectionHeading } from "@/components/home/section-heading";
import { PageTop } from "@/components/layout/page-top";
import { ListReportButton } from "@/components/lists/list-report-button";
import { OwnerTools } from "@/components/profile/owner-tools";
import { getOwnLists, listCharacterOptions } from "@/lib/data/lists";
import { getOwnProfile, getProfileByHandle } from "@/lib/data/profile";
import { roleOf } from "@/lib/security/roles";
import { getSessionUser } from "@/lib/security/session";

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

  const viewer = await getSessionUser();
  const own = viewer ? await getOwnProfile(viewer.uid) : null;
  const isOwner = viewer !== null && own !== null && own.handle === profile.handle;
  const [ownLists, options] =
    isOwner && viewer ? await Promise.all([getOwnLists(viewer.uid), listCharacterOptions()]) : [[], []];

  return (
    <div className="mx-auto max-w-3xl px-4 pt-6 pb-24">
      <PageTop back={{ href: "/", label: "Explore" }} trail={[{ label: "Explore", href: "/" }, { label: `@${profile.handle}` }]} />

      <div className="flex items-start gap-4 sm:gap-6">
        <span
          aria-hidden
          className="grid size-16 shrink-0 place-items-center border bg-muted font-display text-3xl font-semibold uppercase sm:size-24 sm:text-5xl"
        >
          {profile.handle.slice(0, 1)}
        </span>
        <div className="min-w-0">
          <p className="eyebrow">{isOwner ? "Your profile" : "Profile"}</p>
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight wrap-break-word sm:text-5xl">
            @{profile.handle}
          </h1>
          {profile.bio ? <p className="mt-3 max-w-xl text-sm whitespace-pre-line">{profile.bio}</p> : null}
        </div>
      </div>

      {isOwner && own && viewer ? (
        <OwnerTools
          profile={own}
          verified={viewer.email_verified === true}
          staff={roleOf(viewer) !== "user"}
          lists={ownLists}
          options={options}
        />
      ) : null}

      <dl className="mt-8 grid grid-cols-3 gap-px border bg-border">
        <div className="bg-background p-3 sm:p-4">
          <dt className="eyebrow">Member since</dt>
          <dd className="mt-1 font-display text-base font-semibold sm:text-xl">{profile.createdAt.slice(0, 10) || "--"}</dd>
        </div>
        <div className="bg-background p-3 sm:p-4">
          <dt className="eyebrow">Feats</dt>
          <dd className="tabular mt-1 font-display text-base font-semibold sm:text-xl">{profile.featsSubmitted}</dd>
        </div>
        <div className="bg-background p-3 sm:p-4">
          <dt className="eyebrow">Lists</dt>
          <dd className="tabular mt-1 font-display text-base font-semibold sm:text-xl">{profile.lists.length}</dd>
        </div>
      </dl>

      <section className="mt-12">
        <SectionHeading title="Lists" />
        {profile.lists.length === 0 ? (
          <p className="mt-6 border p-4 text-sm text-muted-foreground">
            {isOwner ? "You have no public lists yet. Use Edit lists above to make one." : "No public lists yet."}
          </p>
        ) : (
          <div className="mt-6 space-y-6">
            {profile.lists.map((list) => (
              <article key={list.id} className="border">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-muted/50 px-4">
                  <h3 className="py-3 font-display text-xl font-semibold tracking-tight">{list.title}</h3>
                  {isOwner ? null : <ListReportButton listId={list.id} />}
                </div>
                <ol className="divide-y">
                  {list.items.map((item, index) => (
                    <li key={item.characterId} className="grid grid-cols-[2.5rem_1fr] gap-3 p-4">
                      <span className="tabular font-display text-2xl leading-none font-semibold text-muted-foreground">
                        {index + 1}
                      </span>
                      <div className="min-w-0">
                        <Link href={`/characters/${item.characterId}`} className="font-medium underline underline-offset-4">
                          {item.name}
                        </Link>
                        <p className="mt-1 text-sm whitespace-pre-line">{item.reason}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}