import type { Metadata } from "next";
import { DocPage, type DocSection } from "@/components/legal/doc-page";
import { LEGAL } from "@/config/legal";

export const metadata: Metadata = {
  title: "Privacy policy",
  description:
    "What NONI collects, why, who can see it, and how to use your rights under the Kenya Data Protection Act.",
};

const mail = <a href={`mailto:${LEGAL.contact}`}>{LEGAL.contact}</a>;

const SECTIONS: DocSection[] = [
  {
    id: "who",
    title: "Who we are",
    body: (
      <p>
        {LEGAL.operator} runs NONI and decides how your personal data is used, which makes
        it the data controller under the Kenya Data Protection Act, 2019. For anything in
        this policy, contact {mail}.
      </p>
    ),
  },
  {
    id: "collect",
    title: "What we collect",
    body: (
      <ul>
        <li>
          Account: your email address and how you sign in (Google, or email and password).
          Sign-in is handled by Google Firebase Authentication.
        </li>
        <li>
          Profile: the handle and short bio you choose, your avatar and banner, and your
          favourites and lists.
        </li>
        <li>
          Contributions: feats and the proof links you submit, votes, arguments and
          reports.
        </li>
        <li>
          Play: your Glaze balance and history, battle results, fan points, titles, and
          whether you chose to appear on leaderboards.
        </li>
        <li>
          Technical: your IP address, used briefly to limit abuse, and a session cookie
          that keeps you signed in.
        </li>
      </ul>
    ),
  },
  {
    id: "why",
    title: "Why we use it",
    body: (
      <ul>
        <li>
          To run your account and the features you use. This is needed to provide the
          service.
        </li>
        <li>
          To keep NONI safe and fair, for example to stop spam, vote manipulation and
          abuse. This is our legitimate interest.
        </li>
        <li>
          To show you on leaderboards and fan lists. We only do this if you switch it on,
          and you can withdraw that choice at any time.
        </li>
      </ul>
    ),
  },
  {
    id: "public",
    title: "What other people can see",
    body: (
      <>
        <p>
          Public: your handle, bio, avatar and banner, favourites, public lists, and the
          feats and arguments you post. Leaderboard rows and fan badges are public only if
          you opted in.
        </p>
        <p>Never public: your email address and your account identifier.</p>
      </>
    ),
  },
  {
    id: "sharing",
    title: "Who we share it with",
    body: (
      <>
        <p>
          We do not sell your data and we do not run advertising. We use a small set of
          providers who process data for us:
        </p>
        <ul>
          <li>
            Google (Firebase Authentication and Firestore) to sign you in and store the
            data above.
          </li>
          <li>Cloudflare to store and deliver images.</li>
          <li>Our hosting provider to serve the site.</li>
        </ul>
        <p>
          We may also disclose data when the law requires it. At the time of writing we
          use no third-party analytics.
        </p>
      </>
    ),
  },
  {
    id: "transfers",
    title: "Data outside Kenya",
    body: (
      <p>
        Our providers may process data on servers outside Kenya. When that happens we rely
        on the safeguards the Data Protection Act requires for transfers out of the
        country.
      </p>
    ),
  },
  {
    id: "cookies",
    title: "Cookies and storage",
    body: (
      <p>
        We use one essential session cookie that keeps you signed in, and your browser
        stores your light or dark theme choice. We do not use advertising or tracking
        cookies.
      </p>
    ),
  },
  {
    id: "retention",
    title: "How long we keep it",
    body: (
      <>
        <p>
          We keep your data while your account exists. When you ask us to delete your
          account we remove your profile, lists, favourites and personal details.
        </p>
        <p>
          Content you added to the shared record, such as feats and arguments, may stay in
          anonymised form because rankings depend on it. We may keep limited records where
          the law requires or to protect against abuse.
        </p>
      </>
    ),
  },
  {
    id: "rights",
    title: "Your rights",
    body: (
      <>
        <p>
          You can ask to see the data we hold about you, correct it, delete it, restrict
          or object to how we use it, receive a copy, and withdraw consent you gave. Email{" "}
          {mail} and we will respond promptly and within the time the law requires.
        </p>
        <p>
          You can also complain to the Office of the Data Protection Commissioner in
          Kenya.
        </p>
      </>
    ),
  },
  {
    id: "security",
    title: "Security",
    body: (
      <p>
        We protect accounts with server-side session cookies, we restrict who can write to
        our database, and we use encrypted connections. No system is perfectly secure. If
        a breach affects you we will tell you and the Data Protection Commissioner as the
        law requires.
      </p>
    ),
  },
  {
    id: "children",
    title: "Age",
    body: (
      <p>
        NONI is for people aged 18 and over. We do not knowingly collect data from anyone
        younger, and we will delete it if we learn we have.
      </p>
    ),
  },
  {
    id: "changes",
    title: "Changes",
    body: (
      <p>
        If we change this policy in a way that matters, we will update the date above and
        tell signed-in users before it takes effect.
      </p>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <DocPage
      eyebrow="Policy"
      title="Privacy"
      intro="What we collect, why, who can see it, and how you stay in control."
      sections={SECTIONS}
    />
  );
}
