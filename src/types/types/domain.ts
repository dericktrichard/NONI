import type { HaxClaim, FeatClaim } from "@/lib/ranking/profile";
import type { MediaType } from "./character";

export type FirestoreTime = {
  seconds: number;
  nanoseconds: number;
  toDate(): Date;
};

/** The scale-based description of a character that the combat engine consumes */
export interface PowerProfile {
  /** Attack potency tier code, such as "7-B" */
  attackPotency: string;
  /** Durability tier code. Uses the same ladder as attack potency. */
  durability: string;
  /** Speed level, such as "Relativistic" */
  speed: string;
  /** 3 for ordinary space, higher for extradimensional beings */
  dimension: number;
  hax: HaxClaim[];
  resistances: HaxClaim[];
}

export interface VerseDoc {
  name: string;
  media: MediaType;
  characterCount: number;
  /** Aggregate score for verse-to-verse rankings */
  score: number;
  rank: number | null;
  imageUrl: string | null;
  createdAt: FirestoreTime;
}

export interface CharacterDoc {
  /** Equals the document ID */
  slug: string;
  name: string;
  aliases: string[];
  /** Lowercase word prefixes for rule-based prefix search, see search-keys.ts */
  searchKeys: string[];
  verseId: string;
  verseName: string;
  media: MediaType;
  tags: string[];

  /** Editor-managed baseline, used for anything with no verified feat yet */
  seed: PowerProfile;
  /** Seed overridden by verified feats. Written by the server, never by clients. */
  profile: PowerProfile;

  /** Denormalized from profile so list queries and cards need no extra work */
  tier: string;
  tierGroup: number;
  speed: string;

  /** Computed by the ranking engine, never by clients */
  score: number;
  /** Mean win probability against the field, 0 to 1 */
  winRate: number;
  wins: number;
  losses: number;
  rank: number | null;
  previousRank: number | null;

  featCount: number;
  verifiedFeatCount: number;
  /** 0 to 1 share of feats that are verified */
  evidence: number;
  imageUrl: string | null;
  imageCredit: string | null;
  createdAt: FirestoreTime;
  updatedAt: FirestoreTime;
}

export type FeatStatus = "pending" | "verified" | "rejected";

export type ProofType = "panel" | "video" | "quote" | "official";

export interface Proof {
  type: ProofType;
  /** https only, validated on the server */
  url: string;
  /** Chapter and page, a timestamp like 12:45, or a volume and chapter */
  locator: string;
  /** Required for quote proofs */
  excerpt?: string;
}

export interface FeatDoc {
  characterId: string;
  authorId: string;
  authorName: string;
  title: string;
  description: string;
  /** Denormalized from claim.category so lists can filter and index on it */
  category: FeatClaim["category"];
  /** What the feat asserts, on the power scales. Validated against them on the server. */
  claim: FeatClaim;
  proofs: Proof[];
  status: FeatStatus;
  /** Set by moderators. A locked status is final until a moderator changes it. */
  staffLocked: boolean;
  upvotes: number;
  downvotes: number;
  /** upvotes minus downvotes */
  netScore: number;
  createdAt: FirestoreTime;
  updatedAt: FirestoreTime;
  verifiedAt: FirestoreTime | null;
}

/** Stored at .../feats/{featId}/votes/{uid} */
export interface FeatVoteDoc {
  uid: string;
  characterId: string;
  featId: string;
  value: 1 | -1;
  createdAt: FirestoreTime;
}

export interface MatchupDoc {
  /** Document ID is matchupId(a, b), alphabetical */
  characterAId: string;
  characterBId: string;
  /** For array-contains queries: all matchups involving one character */
  characterIds: [string, string];
  /** Denormalized so list cards render without extra reads */
  aName: string;
  bName: string;
  aImageUrl: string | null;
  bImageUrl: string | null;
  /** Community vote tallies. The engine verdict is computed, never stored here. */
  votesA: number;
  votesB: number;
  argumentCount: number;
  createdBy: string;
  createdAt: FirestoreTime;
  lastActivityAt: FirestoreTime;
}

export type MatchupSide = "a" | "b";

/** Stored at /matchups/{id}/votes/{uid} */
export interface MatchupVoteDoc {
  uid: string;
  matchupId: string;
  side: MatchupSide;
  createdAt: FirestoreTime;
}

export interface Citation {
  characterId: string;
  featId: string;
}

export interface ArgumentDoc {
  authorId: string;
  authorName: string;
  side: MatchupSide;
  body: string;
  /** At least one is required, each must be a real feat of character A or B */
  citations: Citation[];
  status: "visible" | "hidden";
  upvotes: number;
  downvotes: number;
  netScore: number;
  createdAt: FirestoreTime;
}

export interface UserDoc {
  handle: string;
  displayName: string;
  photoURL: string | null;
  bio: string;
  reputation: number;
  badges: string[];
  featsSubmitted: number;
  featsVerified: number;
  argumentsPosted: number;
  createdAt: FirestoreTime;
}
// Roles (moderator, admin) live in Auth custom claims, never in this document.

export type CreatorPlatform = "youtube" | "tiktok" | "x" | "twitch" | "discord" | "website";

export interface CreatorDoc {
  /** Linked NONI account, if the creator has one */
  userId: string | null;
  displayName: string;
  handle: string;
  bio: string;
  avatarUrl: string | null;
  links: Partial<Record<CreatorPlatform, string>>;
  tipUrl: string | null;
  verified: boolean;
  badges: string[];
  createdAt: FirestoreTime;
}
