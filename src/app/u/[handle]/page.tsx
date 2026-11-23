import { Lock } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { Portrait } from "@/components/characters/portrait";
import { ListCard } from "@/components/lists/list-card";
import { ProfileAvatar, ProfileBanner } from "@/components/profile/banner";
import { Bio } from "@/components/profile/bio";
import { OwnFeats } from "@/components/profile/own-feats";
import { NewListButton } from "@/components/profile/new-list-button";
import { OwnerTools } from "@/components/profile/owner-tools";
import { ProfileTitle } from "@/components/profile/profile-title";
import { ReportImageButton } from "@/components/profile/report-image-button";
import { SectionLabel } from "@/components/profile/section-label";
import { Badges } from "@/components/standing/badges";
import { GlazePanel } from "@/components/standing/glaze-panel";
import { getActivityStats, listOwnFeats, uidForHandle } from "@/lib/data/activity";
import { getOwnLists } from "@/lib/data/lists";
import { getOwnProfile, getProfileByHandle } from "@/lib/data/profile";
import { getBadges, getMyStanding } from "@/lib/data/standing";
import { canViewProfile } from "@/lib/profile/visibility";
import { roleOf } from "@/lib/security/roles";
import { getSessionUser } from "@/lib/security/session";
import { cn } from "@/lib/utils";

const load = cache(getProfileByHandle);

type Props = { params: Promise<{ handle: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params;
  const profile = await load(handle);
  if (!profile) return { title: "Profile not found" };

  if (profile.private) {
    return {
      title: `@${profile.handle}`,
      description: "This profile is private.",
      robots: { index: false, follow: false },
    };
  }

  return {
    title: `@${profile.handle}`,
    description: profile.bio || `@${profile.handle} on NONI`,
  };
}

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="shrink-0 px-4 py-2.5">
      <dt className="eyebrow">{label}</dt>
      <dd className="tabular font-display text-lg font-semibold">{children}</dd>
    </div>
  );
}

function PrivateNotice({ handle }: { handle: string }) {
  return (
    <div className="mx-auto max-w-3xl px-4 pt-10 pb-24">
      <p className="eyebrow">Profile</p>
      <h1 className="font-display mt-1 text-2xl font-semibold tracking-tight wrap-break-word sm:text-3xl">
        @{handle}
      </h1>
      <p className="text-muted-foreground mt-6 flex items-center gap-3 border p-4 text-sm">
        <Lock className="size-4 shrink-0" aria-hidden />
        This profile is private.
      </p>
    </div>
  );
}

const shown = (value: number | null) => (value === null ? "--" : value);

export default async function ProfilePage({ params }: Props) {
  const { handle } = await params;
  const base = await load(handle);
  if (!base) notFound();

  const viewer = await getSessionUser();
  const own = viewer ? await getOwnProfile(viewer.uid) : null;
  const isOwner = viewer !== null && own !== null && own.handle === base.handle;
  const staff = viewer !== null && roleOf(viewer) !== "user";

  if (!canViewProfile(base.private, isOwner, staff))
    return <PrivateNotice handle={base.handle} />;

  const profile = base.private
    ? ((await getProfileByHandle(handle, true)) ?? base)
    : base;

  const uid = isOwner && viewer ? viewer.uid : await uidForHandle(profile.handle);
  const [stats, ownLists, ownFeats, standing] = await Promise.all([
    uid ? getActivityStats(uid) : Promise.resolve({ votes: null, arguments: null }),
    isOwner && viewer ? getOwnLists(viewer.uid) : Promise.resolve([]),
    isOwner && viewer ? listOwnFeats(viewer.uid) : Promise.resolve([]),
    uid ? getMyStanding(uid).catch(() => null) : Promise.resolve(null),
  ]);

  const lists = isOwner
    ? ownLists.filter((list) => list.status === "visible")
    : profile.lists;
  const visibleStanding = standing && (isOwner || standing.boards) ? standing : null;
  const badges = uid ? await getBadges(uid, isOwner) : [];
  const onBoards = standing?.boards ?? false;
  const uploadedAvatar =
    profile.look.avatarId === null && profile.look.avatarUrl !== null;
  const uploadedBanner =
    profile.look.bannerId === null && profile.look.bannerUrl !== null;

  return (
    <>
      <ProfileBanner
        look={profile.look}
        className="-mt-(--nav-space) h-[calc(var(--nav-space)+7rem)] w-full border-0! sm:h-[calc(var(--nav-space)+10rem)]"
      />
      <div className="mx-auto max-w-6xl px-4 pb-20">
        <header className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-start gap-3 sm:gap-4">
            <ProfileAvatar
              look={profile.look}
              handle={profile.handle}
              className="-mt-6 size-20 shrink-0 sm:-mt-8 sm:size-24"
            />
            <div className="min-w-0 flex-1 pt-2">
              <h1 className="font-display truncate text-lg leading-tight font-semibold tracking-tight sm:text-2xl">
                @{profile.handle}
              </h1>
              <ProfileTitle look={profile.look} />
              {profile.bio ? <Bio text={profile.bio} /> : null}
            </div>
          </div>

          <div className="shrink-0 pt-2">
            {isOwner && own && viewer ? (
              <OwnerTools
                profile={own}
                look={profile.look}
                verified={viewer.email_verified === true}
                staff={staff}
                lists={ownLists}
                onBoards={onBoards}
              />
            ) : uid && (uploadedAvatar || uploadedBanner) ? (
              <ReportImageButton
                uid={uid}
                avatar={uploadedAvatar}
                banner={uploadedBanner}
              />
            ) : null}
          </div>
        </header>

        <p className="eyebrow mt-3">
          {isOwner ? "Your profile" : "Profile"}
          {profile.private ? " · Private" : ""}
        </p>
        {profile.private ? (
          <p className="text-muted-foreground mt-3 flex items-center gap-2 text-sm">
            <Lock className="size-4 shrink-0" aria-hidden />
            {isOwner
              ? "Only you and moderators can see this profile."
              : "Private profile, visible to moderators only."}
          </p>
        ) : null}
        {isOwner && viewer && viewer.email_verified !== true ? (
          <p className="border-foreground bg-muted mt-4 max-w-md border-l-2 p-3 text-sm">
            Your email is not verified. Open the link we emailed you, then sign in again.
            Voting and submitting need a verified email.
          </p>
        ) : null}

        <dl className="no-scrollbar mt-5 flex divide-x overflow-x-auto border">
          <Stat label="Feats">{profile.featsSubmitted}</Stat>
          <Stat label="Arguments">{shown(stats.arguments)}</Stat>
          <Stat label="Votes cast">{shown(stats.votes)}</Stat>
          <Stat label="Public lists">{profile.lists.length}</Stat>
          <Stat label="Favourites">{profile.favouriteCount}</Stat>
        </dl>

        <div
          className={cn(
            "mt-6 grid gap-x-8 gap-y-2",
            visibleStanding && "lg:grid-cols-[minmax(0,1fr)_20rem]",
          )}
        >
          {visibleStanding ? (
            <aside className="lg:sticky lg:top-[calc(var(--nav-space)+1rem)] lg:col-start-2 lg:row-start-1 lg:self-start">
              <GlazePanel standing={visibleStanding} isOwner={isOwner} />
            </aside>
          ) : null}

          <div className="min-w-0 lg:col-start-1 lg:row-start-1">
            <section>
              <SectionLabel
                title="Favourite characters"
                aside={
                  profile.favouriteCount > 0
                    ? `${profile.favouriteCount} total`
                    : undefined
                }
              />
              {profile.favourites.length === 0 ? (
                <p className="text-muted-foreground mt-4 border p-4 text-sm">
                  {isOwner
                    ? "No favourites yet. Press Favourite on any character page to add one."
                    : "No favourite characters yet."}
                </p>
              ) : (
                <ul className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-5 xl:grid-cols-6">
                  {profile.favourites.map((f) => (
                    <li key={f.id}>
                      <Link href={`/characters/${f.id}`} className="group block">
                        <Portrait
                          name={f.name}
                          src={f.imageUrl}
                          sizes="(min-width: 768px) 112px, 30vw"
                          className="aspect-2/3 w-full border"
                        />
                        <p className="mt-1.5 truncate text-sm font-medium group-hover:underline">
                          {f.name}
                        </p>
                        <p className="eyebrow truncate">{f.verse}</p>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="mt-10">
              <SectionLabel title="Lists" />
              {lists.length === 0 ? (
                <p className="text-muted-foreground mt-4 border p-4 text-sm">
                  {isOwner ? (
                    <>
                      No lists yet. Make your first one.
                      <span className="mt-3 block">
                        <NewListButton />
                      </span>
                    </>
                  ) : (
                    "No public lists yet."
                  )}
                </p>
              ) : (
                <div className="mt-4 space-y-6">
                  {lists.map((list) => (
                    <ListCard key={list.id} list={list} isOwner={isOwner} />
                  ))}
                </div>
              )}
            </section>

            <Badges badges={badges} isOwner={isOwner} onBoards={onBoards} />

            {isOwner ? (
              <section className="mt-10">
                <SectionLabel title="Your feats" />
                <OwnFeats feats={ownFeats} />
              </section>
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
}
