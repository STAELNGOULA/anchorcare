/**
 * Business onboarding is complete once the director profile is linked to an org.
 * `onboarding_status` alone is not sufficient (legacy stub could set active without org).
 */
export function businessOnboardingComplete(
  orgId: string | null | undefined,
): boolean {
  return Boolean(orgId);
}

export function needsBusinessOnboarding(
  orgId: string | null | undefined,
): boolean {
  return !orgId;
}
