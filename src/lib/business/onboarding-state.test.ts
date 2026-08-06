import { describe, expect, it } from "vitest";
import {
  businessOnboardingComplete,
  needsBusinessOnboarding,
} from "@/lib/business/onboarding-state";

describe("business onboarding state", () => {
  it("treats missing org as incomplete even when status is active", () => {
    expect(needsBusinessOnboarding(null)).toBe(true);
    expect(businessOnboardingComplete(null)).toBe(false);
  });

  it("treats org_id as complete", () => {
    expect(needsBusinessOnboarding("org-123")).toBe(false);
    expect(businessOnboardingComplete("org-123")).toBe(true);
  });
});
