import { describe, expect, it } from "vitest";
import {
  needsOnboardingRedirect,
  resolvePostAuthPath,
} from "@/lib/auth/onboarding";

describe("business onboarding redirects", () => {
  it("sends business_admin without org to onboarding", () => {
    expect(
      resolvePostAuthPath("business_admin", "active", null),
    ).toBe("/business/onboarding");
    expect(
      needsOnboardingRedirect("business_admin", "active", "/business/dashboard", null),
    ).toBe("/business/onboarding");
  });

  it("sends business_admin with org to dashboard", () => {
    expect(
      resolvePostAuthPath("business_admin", "program_setup", "org-1"),
    ).toBe("/business/dashboard");
    expect(
      needsOnboardingRedirect("business_admin", "program_setup", "/business/dashboard", "org-1"),
    ).toBeNull();
  });

  it("does not redirect when already on onboarding route", () => {
    expect(
      needsOnboardingRedirect("business_admin", "active", "/business/onboarding", null),
    ).toBeNull();
  });
});
