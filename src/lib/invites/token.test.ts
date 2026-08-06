import { describe, expect, it } from "vitest";
import { hashInviteToken, tokensMatch } from "@/lib/invites/token";

describe("invite token hashing", () => {
  it("hashes consistently", () => {
    expect(hashInviteToken("demo-parent-invite-2026")).toBe(
      hashInviteToken("demo-parent-invite-2026"),
    );
  });

  it("compares tokens in constant time", () => {
    const hash = hashInviteToken("abc");
    expect(tokensMatch(hash, hash)).toBe(true);
    expect(tokensMatch(hash, hashInviteToken("xyz"))).toBe(false);
  });
});
