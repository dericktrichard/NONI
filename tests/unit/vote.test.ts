import { describe, expect, it } from "vitest";
import { applyVote } from "@/lib/ranking/vote";

describe("applyVote", () => {
  const tally = { upvotes: 4, downvotes: 2 };

  it("adds a first vote", () => {
    expect(applyVote(tally, 0, 1)).toEqual({ upvotes: 5, downvotes: 2 });
    expect(applyVote(tally, 0, -1)).toEqual({ upvotes: 4, downvotes: 3 });
  });

  it("moves a vote when it changes side", () => {
    expect(applyVote(tally, 1, -1)).toEqual({ upvotes: 3, downvotes: 3 });
    expect(applyVote(tally, -1, 1)).toEqual({ upvotes: 5, downvotes: 1 });
  });

  it("removes a vote", () => {
    expect(applyVote(tally, 1, 0)).toEqual({ upvotes: 3, downvotes: 2 });
    expect(applyVote(tally, -1, 0)).toEqual({ upvotes: 4, downvotes: 1 });
  });

  it("changes nothing when the vote is repeated", () => {
    expect(applyVote(tally, 1, 1)).toEqual(tally);
    expect(applyVote(tally, 0, 0)).toEqual(tally);
  });

  it("never goes below zero", () => {
    expect(applyVote({ upvotes: 0, downvotes: 0 }, 1, 0)).toEqual({ upvotes: 0, downvotes: 0 });
  });
});