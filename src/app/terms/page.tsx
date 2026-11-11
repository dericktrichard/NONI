import type { Metadata } from "next";
import { DocPage, type DocSection } from "@/components/legal/doc-page";
import { LEGAL } from "@/config/legal";

export const metadata: Metadata = {
  title: "Terms of use",
  description:
    "The rules for using NONI, including accounts, content, Glaze and fair play.",
};

const mail = <a href={`mailto:${LEGAL.contact}`}>{LEGAL.contact}</a>;

const SECTIONS: DocSection[] = [
  {
    id: "using",
    title: "Using NONI",
    body: (
      <p>
        By using NONI you agree to these terms, the privacy policy and the content policy.
        You must be 18 or older. If you do not agree, please do not use the service.
      </p>
    ),
  },
  {
    id: "account",
    title: "Your account",
    body: (
      <p>
        You are responsible for your account. Give accurate details, keep your sign-in
        safe, and do not run more than one account to vote, report or rank for yourself.
        Handles must not impersonate anyone or be offensive, and we can change or remove
        one that breaks this.
      </p>
    ),
  },
  {
    id: "content",
    title: "What you post",
    body: (
      <>
        <p>
          You keep ownership of what you write. By posting feats, arguments, lists or a
          bio you let NONI display, store and moderate them as part of the service. Post
          only what you have the right to share, link proof rather than copying long
          passages, and keep it accurate.
        </p>
        <p>
          We may hide or remove content that breaks the content policy, and we log
          moderation actions.
        </p>
      </>
    ),
  },
  {
    id: "rankings",
    title: "Rankings and verdicts",
    body: (
      <p>
        NONI ranks fictional characters for entertainment and debate. Results come from
        community-verified evidence under fixed rules. They are not facts about the real
        world and not statements by any creator or rights holder. We may change the rules
        and recompute rankings when we improve the engine.
      </p>
    ),
  },
  {
    id: "glaze",
    title: "Glaze",
    body: (
      <ul>
        <li>
          Glaze is a virtual score with no cash value. It cannot be bought, sold,
          exchanged or transferred.
        </li>
        <li>
          Stakes risk only Glaze. A balance can fall to zero, and free play lets you earn
          again.
        </li>
        <li>
          We may correct or reverse balances after a bug or abuse, and we may change
          rewards, payouts and daily caps.
        </li>
        <li>
          If we ever offer Glaze for sale we will update these terms first and ask you to
          accept them.
        </li>
      </ul>
    ),
  },
  {
    id: "fair",
    title: "Fair play",
    body: (
      <>
        <p>
          Do not use bots or scripts, exploit bugs, manipulate votes, run multiple
          accounts, bypass limits, or try to reach other people data. Breaking these rules
          can lead to removed content, reset balances or a ban.
        </p>
        <p>If you find a security problem, please tell us at {mail} before sharing it.</p>
      </>
    ),
  },
  {
    id: "rights",
    title: "Characters and third-party material",
    body: (
      <p>
        Characters, names and art belong to their rights holders. NONI is an independent
        fan project and is not affiliated with or endorsed by them. The content policy
        explains how to send a takedown request.
      </p>
    ),
  },
  {
    id: "service",
    title: "Beta and availability",
    body: (
      <p>
        NONI is in beta. We may change, pause or remove features, and we will try to give
        notice of changes that affect you. The service may be unavailable from time to
        time.
      </p>
    ),
  },
  {
    id: "liability",
    title: "Liability",
    body: (
      <p>
        NONI is provided as is, without a promise that it will be uninterrupted or error
        free. To the extent the law allows, we are not liable for losses from using it,
        including loss of Glaze. Nothing in these terms limits rights you have under
        Kenyan law that cannot be limited.
      </p>
    ),
  },
  {
    id: "ending",
    title: "Ending your use",
    body: (
      <p>
        You can stop using NONI at any time and ask us to delete your account as described
        in the privacy policy. We may suspend or end accounts that break these terms.
      </p>
    ),
  },
  {
    id: "law",
    title: "Governing law",
    body: (
      <p>
        These terms are governed by the laws of Kenya, and the courts of Kenya have
        jurisdiction, unless the law gives you the right to go elsewhere.
      </p>
    ),
  },
  {
    id: "contact",
    title: "Changes and contact",
    body: (
      <p>
        If we change these terms in a way that matters, we will update the date above and
        tell signed-in users. Questions go to {mail}.
      </p>
    ),
  },
];

export default function TermsPage() {
  return (
    <DocPage
      eyebrow="Policy"
      title="Terms of use"
      intro="The rules that keep NONI fair, in plain language."
      sections={SECTIONS}
    />
  );
}
