import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { Portrait } from "@/components/characters/portrait";
import { SectionHeading } from "@/components/home/section-heading";
import { PageTop } from "@/components/layout/page-top";
import { ListCard } from "@/components/lists/list-card";
import { ProfileAvatar, ProfileBanner } from "@/components/profile/banner";
import { OwnFeats } from "@/components/profile/own-feats";
import { OwnerTools } from "@/components/profile/owner-tools";
import { Badges } from "@/components/standing/badges";
import { getActivityStats, listOwnFeats, uidForHandle } from "@/lib/data/activity";
import { getOwnLists } from "@/lib/data/lists";
import { getBadges, isOnBoards } from "@/lib/data/standing";
import { getOwnProfile, getProfileByHandle } from "@/lib/data/profile";
import { roleOf } from "@/lib/security/roles";
import { getSessionUser } from "@/lib/security/session";

const load = cache(getProfileByHandle);

type Props = { params: Promise<{ handle: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params;
  const profile = await load(handle);
  if (!profile) return { title: "Profile not found" };
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

const shown = (value: number | null) => (value === null ? "--" : value);

export default async function ProfilePage({ params }: Props) {
  const { handle } = await params;
  const profile = await load(handle);
  if (!profile) notFound();

  const viewer = await getSessionUser();
  const own = viewer ? await getOwnProfile(viewer.uid) : null;
  const isOwner = viewer !== null && own !== null && own.handle === profile.handle;

  const uid = isOwner && viewer ? viewer.uid : await uidForHandle(profile.handle);
  const [stats, ownLists, ownFeats] = await Promise.all([
    uid ? getActivityStats(uid) : Promise.resolve({ votes: null, arguments: null }),
    isOwner && viewer ? getOwnLists(viewer.uid) : Promise.resolve([]),
    isOwner && viewer ? listOwnFeats(viewer.uid) : Promise.resolve([]),
  ]);

  const lists = isOwner
    ? ownLists.filter((list) => list.status === "visible")
    : profile.lists;
  const badges = uid ? await getBadges(uid, isOwner) : [];
  const onBoards = isOwner && uid ? await isOnBoards(uid) : false;

  return (
    <div className="mx-auto max-w-3xl px-4 pt-6 pb-24">
      <PageTop
        back={{ href: "/", label: "Explore" }}
        trail={[{ label: "Explore", href: "/" }, { label: `@${profile.handle}` }]}
      />

      <header>
        <ProfileBanner look={profile.look} className="h-32 sm:h-52" />
        <ProfileAvatar
          look={profile.look}
          handle={profile.handle}
          className="-mt-10 ml-4 size-20 sm:-mt-14 sm:ml-6 sm:size-28"
        />

        <div className="mt-4">
          <p className="eyebrow">{isOwner ? "Your profile" : "Profile"}</p>
          <h1 className="font-display mt-1 text-3xl font-semibold tracking-tight wrap-break-word sm:text-5xl">
            @{profile.handle}
          </h1>
          {profile.bio ? (
            <p className="mt-3 max-w-xl text-sm whitespace-pre-line">{profile.bio}</p>
          ) : null}
        </div>

        {isOwner && own && viewer ? (
          <OwnerTools
            profile={own}
            look={profile.look}
            verified={viewer.email_verified === true}
            staff={roleOf(viewer) !== "user"}
            lists={ownLists}
          />
        ) : null}
      </header>

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
            {isOwner
              ? "No lists yet. Use Edit lists above to make one."
              : "No public lists yet."}
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
  );
}
