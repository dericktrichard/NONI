import { describe, expect, it } from "vitest";
import { validateFeatProofs, validateProof } from "@/lib/ranking/proof";
import type { Proof } from "@/types/domain";

const panel: Proof = {
  type: "panel",
  url: "https://example.com/manga/ch-45",
  locator: "Ch. 45 p.12",
};

describe("validateProof", () => {
  it("accepts a well formed panel proof", () => {
    expect(validateProof(panel)).toEqual([]);
  });

  it("rejects non-https, credentials, localhost and IP addresses", () => {
    for (const url of [
      "http://example.com/a",
      "javascript:alert(1)",
      "https://user:pass@example.com/a",
      "https://localhost/a",
      "https://192.168.1.10/a",
      "https://[::1]/a",
    ]) {
      expect(validateProof({ ...panel, url })).toContain("url_invalid");
    }
  });

  it("rejects link shorteners", () => {
    expect(validateProof({ ...panel, url: "https://bit.ly/abc" })).toContain("url_blocked");
  });

  it("requires video proof on a video host with a timestamp", () => {
    const video: Proof = { type: "video", url: "https://www.youtube.com/watch?v=abc", locator: "12:45" };
    expect(validateProof(video)).toEqual([]);
    expect(validateProof({ ...video, locator: "1:02:33" })).toEqual([]);
    expect(validateProof({ ...video, locator: "12 minutes" })).toContain("locator_format");
    expect(validateProof({ ...video, locator: "75:10" })).toContain("locator_format");
    expect(validateProof({ ...video, url: "https://example.com/v" })).toContain("video_host");
  });

  it("requires a number in panel and quote locators", () => {
    expect(validateProof({ ...panel, locator: "somewhere" })).toContain("locator_format");
    expect(validateProof({ ...panel, locator: "  " })).toContain("locator_missing");
  });

  it("requires an excerpt of sane length for quotes", () => {
    const quote: Proof = {
      type: "quote",
      url: "https://example.com/novel",
      locator: "Vol 3 Ch 12",
      excerpt: "He crossed the entire galaxy before the echo of his step faded.",
    };
    expect(validateProof(quote)).toEqual([]);
    expect(validateProof({ ...quote, excerpt: undefined })).toContain("excerpt_missing");
    expect(validateProof({ ...quote, excerpt: "too short" })).toContain("excerpt_length");
    expect(validateProof({ ...quote, excerpt: "x".repeat(301) })).toContain("excerpt_length");
  });
});

describe("validateFeatProofs", () => {
  it("requires between one and five proofs", () => {
    expect(validateFeatProofs([]).map((i) => i.code)).toContain("too_few");
    const six = Array.from({ length: 6 }, (_, i) => ({ ...panel, locator: `Ch. ${i + 1}` }));
    expect(validateFeatProofs(six).map((i) => i.code)).toContain("too_many");
  });

  it("flags duplicates, ignoring trailing slashes and fragments", () => {
    const dupe = { ...panel, url: "https://EXAMPLE.com/manga/ch-45/#top" };
    const issues = validateFeatProofs([panel, dupe]);
    expect(issues).toEqual([expect.objectContaining({ code: "duplicate", index: 1 })]);
  });

  it("reports which proof has the problem", () => {
    const issues = validateFeatProofs([panel, { ...panel, url: "http://bad.com/x", locator: "Ch. 2" }]);
    expect(issues[0]).toMatchObject({ code: "url_invalid", index: 1 });
  });
});