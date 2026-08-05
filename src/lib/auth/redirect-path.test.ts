import { isValidRedirectPath } from "@/lib/auth/redirect-path";
import { describe, expect, it } from "vitest";

describe("isValidRedirectPath", () => {
  it("allows safe internal paths", () => {
    expect(isValidRedirectPath("/parent/today")).toBe(true);
  });

  it("blocks open redirects", () => {
    expect(isValidRedirectPath("//evil.com")).toBe(false);
    expect(isValidRedirectPath("https://evil.com")).toBe(false);
  });

  it("blocks auth routes", () => {
    expect(isValidRedirectPath("/login")).toBe(false);
  });
});
