import type { Metadata } from "next";
import { DocPage, type DocSection } from "@/components/legal/doc-page";
import { GLAZE } from "@/lib/glaze/rules";
import { FAN } from "@/lib/standing/rules";

export const metadata: Metadata = {
  title: "How it works",
  description:
    "How a character earns its rank, how a matchup is decided, and what is left to chance.",
};

const STEPS = [
  ["Evidence", "A feat with a primary proof"],
  ["Verify", "The community votes it in"],
  ["Profile", "The best verified claim in each category"],
  ["Rank", "Fixed rules turn the profile into a place"],
] as const;

const lead = (
  <ol className="bg-border mt-10 grid grid-cols-2 gap-px border sm:grid-cols-4">
    {STEPS.map(([title, text], index) => (
      <li key={title} className="bg-background p-4">
        <span className="tabular font-display flex items-center gap-2 text-3xl font-semibold">
          {index + 1}
          {index === STEPS.length - 1 ? (
            <span className="bg-accent size-2" aria-hidden />
          ) : null}
        </span>
        <p className="font-display mt-3 text-lg font-semibold">{title}</p>
        <p className="text-muted-foreground mt-1 text-xs">{text}</p>
      </li>
    ))}
  </ol>
);

const SECTIONS: DocSection[] = [
  {
    id: "evidence",
    title: "Evidence comes first",
    body: (
      <>
        <p>
          Every character is described by feats. A feat is a specific claim, such as
          surviving an attack or crossing a distance, tied to a scene. Each feat must link
          at least one primary proof: the original manga, episode, game or book.
        </p>
        <p>
          Wiki pages, videos and threads can be added as secondary references, up to three
          per feat. They help readers check the claim but can never carry it alone.
        </p>
      </>
    ),
  },
  {
    id: "verification",
    title: "Verification",
    body: (
      <>
        <p>
          New feats start as pending. The community votes on them, and a feat that earns
          enough upvotes becomes verified. Moderators can verify, reject or reset a feat,
          and every moderator action is written to a log. You cannot vote on your own
          feat.
        </p>
        <p>Only verified feats count. A pending feat has no effect on any ranking.</p>
      </>
    ),
  },
  {
    id: "profile",
    title: "The power profile",
    body: (
      <p>
        For each category (attack potency, durability, speed, dimensional reach, hax and
        resistance) the highest verified claim sets the character level. The result is the
        power profile on every character page, and the evidence meter shows how much of it
        is verified.
      </p>
    ),
  },
  {
    id: "rank",
    title: "Tier and rank",
    body: (
      <>
        <p>
          A character tier and score come from the power profile through fixed rules, and
          ties break in a fixed order. The same evidence always gives the same ranking.
        </p>
        <p>
          Rankings are not set by hand. Staff review evidence, they do not move characters
          up or down, and every action is logged.
        </p>
      </>
    ),
  },
  {
    id: "matchups",
    title: "How a matchup is decided",
    body: (
      <>
        <p>
          A matchup compares two power profiles with fixed rules. It looks at speed,
          attack against durability, dimensional reach, and special abilities against
          resistances. The page shows the verdict, the win probability and the reasons
          behind it.
        </p>
        <p>
          When neither side can hurt the other the result is a stalemate. The same two
          characters always give the same verdict. Community votes and arguments sit
          beside it and never change it.
        </p>
      </>
    ),
  },
  {
    id: "battles",
    title: "What is left to chance",
    body: (
      <p>
        Team battles and tournaments use the same engine, but each fight is a weighted
        dice roll rather than a fixed result. The stronger fighter is favoured, yet even a
        long shot keeps a real chance, so upsets happen. Odds stay hidden until a fight is
        decided, and results are rolled on our server so they cannot be changed from your
        device.
      </p>
    ),
  },
  {
    id: "glaze",
    title: "Glaze",
    body: (
      <>
        <p>
          Glaze is a game score with no cash value. Every account starts with{" "}
          {GLAZE.start}. Practice wins earn a little Glaze, up to a daily limit, and a
          practice loss costs nothing. A daily claim adds {GLAZE.claim.base} Glaze, rising
          to {GLAZE.claim.base + GLAZE.claim.bonus * (GLAZE.claim.maxStreak - 1)} on a
          seven day streak. You can also stake{" "}
          {GLAZE.stakes.filter((stake) => stake > 0).join(", ")} Glaze before a battle: a
          win pays more the longer the odds, and a loss costs the stake.
        </p>
        <p>
          Payouts include a small house edge, so on average stakes lose a little over
          time. Glaze is for play, not for earning. It cannot be bought, sold or
          transferred, and a balance of zero can always be rebuilt through the daily claim
          and practice wins.
        </p>
      </>
    ),
  },
  {
    id: "fans",
    title: "Fans and leaderboards",
    body: (
      <p>
        Playing with a character earns you fan points for them: {FAN.hero} when they are
        your tournament fighter and {FAN.team} for each team slot. The top fan of a
        character wears that character no. 1 fan badge. Leaderboards and fan lists only
        show players who switch them on, and you can switch them off at any time.
      </p>
    ),
  },
  {
    id: "credits",
    title: "Credits",
    body: (
      <p>
        Characters, names and art belong to their creators and rights holders. NONI is an
        independent fan project and is not affiliated with or endorsed by any of them.
        Credits are shown with images, and the content policy explains how to send a
        takedown request.
      </p>
    ),
  },
  {
    id: "beta",
    title: "Beta",
    body: (
      <p>
        NONI is in beta. Rankings are only as good as the evidence behind them, so if you
        spot a wrong claim, report the feat and a moderator will review it.
      </p>
    ),
  },
];

export default function AboutPage() {
  return (
    <DocPage
      eyebrow="How it works"
      title="No hidden hands"
      intro="Exactly how a character gets its place, how a matchup is decided, and what is left to chance."
      sections={SECTIONS}
      lead={lead}
      dated={false}
    />
  );
}
