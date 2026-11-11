import type { Metadata } from "next";
import { DocPage, type DocSection } from "@/components/legal/doc-page";
import { LEGAL } from "@/config/legal";

export const metadata: Metadata = {
  title: "Content policy",
  description:
    "What may be posted on NONI, how to report content, and how to send a copyright takedown request.",
};

const mail = <a href={`mailto:${LEGAL.contact}`}>{LEGAL.contact}</a>;

const SECTIONS: DocSection[] = [
  {
    id: "hosted",
    title: "What NONI hosts",
    body: (
      <p>
        Short text from our users (feats, arguments, lists and bios), links to proof, and
        character images with credits. We link to original works rather than copying them.
      </p>
    ),
  },
  {
    id: "feats",
    title: "Standards for feats",
    body: (
      <ul>
        <li>Each feat needs a primary proof: the original medium.</li>
        <li>Secondary references are allowed, up to three, and cannot stand alone.</li>
        <li>
          Describe the scene in your own words. Do not paste long passages from a work.
        </li>
        <li>
          Claims must be accurate. Reports about wrong or misleading feats are reviewed.
        </li>
      </ul>
    ),
  },
  {
    id: "banned",
    title: "What is not allowed",
    body: (
      <ul>
        <li>Harassment, hate or threats aimed at people.</li>
        <li>Sexual content involving minors, or any sexually explicit material.</li>
        <li>Sharing private information about anyone.</li>
        <li>Spam, scams, malware or misleading links.</li>
        <li>Impersonating a person or organisation.</li>
        <li>Anything illegal in Kenya.</li>
      </ul>
    ),
  },
  {
    id: "reporting",
    title: "Reporting and moderation",
    body: (
      <>
        <p>
          Every feat, argument and list has a report button. Moderators review reports and
          can hide or restore content. Every moderator action is logged.
        </p>
        <p>
          If your content is hidden you can reply to the notice or write to {mail}, and a
          different moderator will look again.
        </p>
      </>
    ),
  },
  {
    id: "takedown",
    title: "Copyright and takedown",
    body: (
      <>
        <p>
          If you own rights in something on NONI and want it removed, send a notice to{" "}
          {mail} with: what the work is, the page address where it appears, your name and
          contact details, a statement that you are the rights holder or act for them, and
          a statement that you believe in good faith that the use is not authorised.
        </p>
        <p>
          We act on valid notices promptly, usually by disabling the content first. We may
          tell the person who posted it, and they can send a response if they believe the
          notice is mistaken. We handle notices in line with Kenyan copyright law.
        </p>
      </>
    ),
  },
  {
    id: "repeat",
    title: "Repeat problems",
    body: (
      <p>
        Accounts that repeatedly post removed content, or that infringe rights after
        notice, may be suspended or closed.
      </p>
    ),
  },
];

export default function ContentPolicyPage() {
  return (
    <DocPage
      eyebrow="Policy"
      title="Content policy"
      intro="What belongs on NONI, how to report something, and how rights holders reach us."
      sections={SECTIONS}
    />
  );
}
