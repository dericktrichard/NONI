import { describe, expect, it } from "vitest";
import { validateFeatProofs, validateProof, proofSource } from "@/lib/ranking/proof";
import type { Proof } from "@/types/domain";

const panel: Proof = { type: "panel", url: "https://example.com/manga/12", locator: "Ch. 12 p. 4" };
const wiki = (n: number): Proof => ({
  source: "secondary",
  type: "wiki",
  url: `https://wiki.example.com/page${n}`,
  locator: "Powers and abilities",
});
const codes = (proofs: Proof[]) => validateFeatProofs(proofs).map((issue) => issue.code);

describe("proof sources", () => {
  it("treats a proof with no source as primary, so older feats stay valid", () => {
    expect(proofSource(panel)).toBe("primary");
    expect(codes([panel])).toEqual([]);
  });

  it("accepts a primary proof with secondary references", () => {
    expect(codes([panel, wiki(1)])).toEqual([]);
  });

  it("refuses a feat whose only proofs are secondary", () => {
    expect(codes([wiki(1)])).toEqual(["no_primary"]);
  });

  it("keeps the empty case as a single too_few issue", () => {
    expect(codes([])).toEqual(["too_few"]);
  });

  it("limits how many secondary references a feat can carry", () => {
    expect(codes([panel, wiki(1), wiki(2), wiki(3), wiki(4)])).toContain("too_many_secondary");
    expect(codes([panel, wiki(1), wiki(2), wiki(3)])).toEqual([]);
  });

  it("does not let a primary proof use a secondary-only type", () => {
    const sneaky: Proof = { type: "wiki", url: "https://wiki.example.com/x", locator: "Powers" };
    expect(validateProof(sneaky)).toContain("type_invalid");
    expect(codes([panel, sneaky])).toContain("type_invalid");
  });

  it("does not let a secondary proof use a primary-only type", () => {
    const bad: Proof = { source: "secondary", type: "panel", url: "https://example.com/a", locator: "Ch. 1" };
    expect(validateProof(bad)).toContain("type_invalid");
  });

  it("allows TikTok only as a secondary video, and still needs a timestamp", () => {
    const tiktok = "https://www.tiktok.com/@someone/video/123";
    const secondary: Proof = { source: "secondary", type: "video", url: tiktok, locator: "0:42" };
    const primary: Proof = { type: "video", url: tiktok, locator: "0:42" };
    expect(validateProof(secondary)).toEqual([]);
    expect(validateProof(primary)).toContain("video_host");
    expect(validateProof({ ...secondary, locator: "somewhere" })).toContain("locator_format");
  });

  it("limits thread links to known hosts", () => {
    const ok: Proof = { source: "secondary", type: "thread", url: "https://x.com/a/status/1", locator: "Thread" };
    expect(validateProof(ok)).toEqual([]);
    expect(validateProof({ ...ok, url: "https://example.com/thread" })).toContain("thread_host");
  });

  it("does not demand page numbers or quotes from secondary references", () => {
    expect(validateProof(wiki(1))).toEqual([]);
  });

  it("still blocks shorteners and non-https links on secondary references", () => {
    expect(validateProof({ ...wiki(1), url: "https://bit.ly/abc" })).toContain("url_blocked");
    expect(validateProof({ ...wiki(1), url: "http://wiki.example.com/a" })).toContain("url_invalid");
  });
});