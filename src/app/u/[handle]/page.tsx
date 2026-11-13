import { Lock } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { Portrait } from "@/components/characters/portrait";
import { SectionHeading } from "@/components/home/section-heading";
import { ListCard } from "@/components/lists/list-card";
import { ProfileAvatar, ProfileBanner } from "@/components/profile/banner";
import { OwnFeats } from "@/components/profile/own-feats";
import { NewListButton } from "@/components/profile/new-list-button";
import { OwnerTools } from "@/components/profile/owner-tools";
import { ReportImageButton } from "@/components/profile/report-image-button";
import { Badges } from "@/components/standing/badges";
import { GlazePanel } from "@/components/standing/glaze-panel";
import { getActivityStats, listOwnFeats, uidForHandle } from "@/lib/data/activity";
import { getOwnLists } from "@/lib/data/lists";
import { getOwnProfile, getProfileByHandle } from "@/lib/data/profile";
import { getBadges, getMyStanding } from "@/lib/data/standing";
import { canViewProfile } from "@/lib/profile/visibility";
import { roleOf } from "@/lib/security/roles";
import { getSessionUser } from "@/lib/security/session";

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
    <div className="bg-background p-3 sm:p-4">
      <dt className="eyebrow">{label}</dt>
      <dd className="tabular font-display mt-1 text-base font-semibold sm:text-xl">
        {children}
      </dd>
    </div>
  );
}

function PrivateNotice({ handle }: { handle: string }) {
  return (
    <div className="mx-auto max-w-3xl px-4 pt-10 pb-24">
      <p className="eyebrow">Profile</p>
      <h1 className="font-display mt-1 text-3xl font-semibold tracking-tight wrap-break-word sm:text-5xl">
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
        className="-mt-(--nav-space) h-[calc(var(--nav-space)+9rem)] w-full sm:h-[calc(var(--nav-space)+15rem)]"
      />

      <div className="mx-auto max-w-3xl px-4 pb-24">
        <header>
          <ProfileAvatar
            look={profile.look}
            handle={profile.handle}
            className="-mt-10 size-20 sm:-mt-14 sm:size-28"
          />

          <div className="mt-4">
            <p className="eyebrow">
              {isOwner ? "Your profile" : "Profile"}
              {profile.private ? " · Private" : ""}
            </p>
            <h1 className="font-display mt-1 text-3xl font-semibold tracking-tight wrap-break-word sm:text-5xl">
              @{profile.handle}
            </h1>
            {profile.bio ? (
              <p className="mt-3 max-w-xl text-sm whitespace-pre-line">{profile.bio}</p>
            ) : null}
            {profile.private ? (
              <p className="text-muted-foreground mt-3 flex items-center gap-2 text-sm">
                <Lock className="size-4 shrink-0" aria-hidden />
                {isOwner
                  ? "Only you and moderators can see this profile."
                  : "Private profile, visible to moderators only."}
              </p>
            ) : null}
          </div>

          {!isOwner && uid && (uploadedAvatar || uploadedBanner) ? (
            <ReportImageButton
              uid={uid}
              avatar={uploadedAvatar}
              banner={uploadedBanner}
            />
          ) : null}

          {isOwner && own && viewer ? (
            <OwnerTools
              profile={own}
              look={profile.look}
              verified={viewer.email_verified === true}
              staff={staff}
              lists={ownLists}
            />
          ) : null}
        </header>

        {visibleStanding ? (
          <GlazePanel standing={visibleStanding} isOwner={isOwner} />
        ) : null}

        <dl className="bg-border mt-8 grid grid-cols-2 gap-px border sm:grid-cols-3">
          <Stat label="Member since">{profile.createdAt.slice(0, 10) || "--"}</Stat>
          <Stat label="Feats">{profile.featsSubmitted}</Stat>
          <Stat label="Arguments">{shown(stats.arguments)}</Stat>
          <Stat label="Votes cast">{shown(stats.votes)}</Stat>
          <Stat label="Public lists">{profile.lists.length}</Stat>
          <Stat label="Favourites">{profile.favouriteCount}</Stat>
        </dl>

        <Badges badges={badges} isOwner={isOwner} onBoards={onBoards} />

        <section className="mt-12">
          <SectionHeading
            title="Favourite characters"
            aside={
              profile.favouriteCount > 0 ? `${profile.favouriteCount} total` : undefined
            }
          />
          {profile.favourites.length === 0 ? (
            <p className="text-muted-foreground mt-6 border p-4 text-sm">
              {isOwner
                ? "No favourites yet. Press Favourite on any character page to add one."
                : "No favourite characters yet."}
            </p>
          ) : (
            <ul className="mt-6 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
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

        <section className="mt-12">
          <SectionHeading title="Lists" />
          {lists.length === 0 ? (
            <p className="text-muted-foreground mt-6 border p-4 text-sm">
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
            <div className="mt-6 space-y-6">
              {lists.map((list) => (
                <ListCard key={list.id} list={list} isOwner={isOwner} />
              ))}
            </div>
          )}
        </section>

        {isOwner ? (
          <section className="mt-12">
            <SectionHeading title="Your feats" />
            <OwnFeats feats={ownFeats} />
          </section>
        ) : null}
      </div>
    </>
  );
}
