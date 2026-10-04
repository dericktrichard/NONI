import { LIMITS } from "@/config/limits";
import { PROOF } from "@/config/ranking";
import type { Proof } from "@/types/domain";

export type ProofIssueCode =
  | "url_invalid"
  | "url_blocked"
  | "video_host"
  | "locator_missing"
  | "locator_format"
  | "excerpt_missing"
  | "excerpt_length"
  | "too_few"
  | "too_many"
  | "duplicate";

export interface ProofIssue {
  code: ProofIssueCode;
  message: string;
  /** Which proof the issue belongs to, absent for feat-level issues */
  index?: number;
}

const MESSAGES: Record<ProofIssueCode, string> = {
  url_invalid: "Use a public https link.",
  url_blocked: "Link shorteners are not accepted. Use the full link.",
  video_host: "Video proof must be hosted on a supported video site.",
  locator_missing: "Add where to find it, such as a chapter and page or a timestamp.",
  locator_format: "Video proof needs a timestamp like 12:45. Panels and quotes need a chapter or page number.",
  excerpt_missing: "Quote proof needs the quoted text.",
  excerpt_length: `The quote must be between ${PROOF.excerptMin} and ${LIMITS.proofExcerpt} characters.`,
  too_few: "Add at least one proof.",
  too_many: `A feat can have at most ${LIMITS.proofsPerFeat} proofs.`,
  duplicate: "This proof is already listed.",
};

const TIMESTAMP = /^(?:\d{1,2}:)?[0-5]?\d:[0-5]\d$/;
const IPV4 = /^\d{1,3}(?:\.\d{1,3}){3}$/;

function hostMatches(host: string, domains: readonly string[]): boolean {
  return domains.some((d) => host === d || host.endsWith(`.${d}`));
}

/** Returns a URL only if it is a public, credential-free https address */
export function parseProofUrl(raw: string): URL | null {
  if (raw.length > PROOF.maxUrlLength) return null;

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }

  if (url.protocol !== "https:") return null;
  if (url.username || url.password) return null;

  const host = url.hostname.toLowerCase();
  if (!host.includes(".")) return null; // localhost, bare hostnames
  if (host.includes(":") || IPV4.test(host)) return null; // IP literals
  if (host.endsWith(".local") || host.endsWith(".internal")) return null;

  return url;
}

function normalizeUrl(raw: string): string {
  const url = parseProofUrl(raw);
  if (!url) return raw.trim().toLowerCase();
  return `${url.hostname.toLowerCase()}${url.pathname.replace(/\/$/, "")}${url.search}`;
}

/** Issues for a single proof. An empty array means the proof is acceptable. */
export function validateProof(proof: Proof): ProofIssueCode[] {
  const issues: ProofIssueCode[] = [];

  const url = parseProofUrl(proof.url);
  if (!url) {
    issues.push("url_invalid");
  } else {
    const host = url.hostname.toLowerCase();
    if (hostMatches(host, PROOF.blockedHosts)) issues.push("url_blocked");
    if (proof.type === "video" && !hostMatches(host, PROOF.videoHosts)) {
      issues.push("video_host");
    }
  }

  const locator = proof.locator.trim();
  if (!locator) {
    issues.push("locator_missing");
  } else if (locator.length > LIMITS.proofLocator) {
    issues.push("locator_format");
  } else if (proof.type === "video" && !TIMESTAMP.test(locator)) {
    issues.push("locator_format");
  } else if ((proof.type === "panel" || proof.type === "quote") && !/\d/.test(locator)) {
    issues.push("locator_format");
  }

  if (proof.type === "quote") {
    const length = (proof.excerpt ?? "").trim().length;
    if (length === 0) issues.push("excerpt_missing");
    else if (length < PROOF.excerptMin || length > LIMITS.proofExcerpt) {
      issues.push("excerpt_length");
    }
  }

  return issues;
}

/** Issues for a whole feat's proof list. An empty array means the feat may be submitted. */
export function validateFeatProofs(proofs: readonly Proof[]): ProofIssue[] {
  const issues: ProofIssue[] = [];

  if (proofs.length < 1) issues.push({ code: "too_few", message: MESSAGES.too_few });
  if (proofs.length > LIMITS.proofsPerFeat) {
    issues.push({ code: "too_many", message: MESSAGES.too_many });
  }

  const seen = new Set<string>();
  proofs.forEach((proof, index) => {
    for (const code of validateProof(proof)) {
      issues.push({ code, message: MESSAGES[code], index });
    }
    const key = `${normalizeUrl(proof.url)}|${proof.locator.trim().toLowerCase()}`;
    if (seen.has(key)) {
      issues.push({ code: "duplicate", message: MESSAGES.duplicate, index });
    }
    seen.add(key);
  });

  return issues;
}