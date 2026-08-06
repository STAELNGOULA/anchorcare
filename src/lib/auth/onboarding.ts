import type { UserRole } from "@/lib/auth/roles";
import { ROLE_HOME_PATH } from "@/lib/auth/roles";
import { needsBusinessOnboarding } from "@/lib/business/onboarding-state";

export type OnboardingStatus = "pending_link" | "program_setup" | "active";

export function resolvePostAuthPath(
  role: UserRole,
  onboarding: OnboardingStatus,
  orgId?: string | null,
): string {
  if (role === "parent" && onboarding === "pending_link") {
    return "/connect";
  }
  if (role === "business_admin" && needsBusinessOnboarding(orgId)) {
    return "/business/onboarding";
  }
  return ROLE_HOME_PATH[role];
}

export function isOnboardingRoute(pathname: string): boolean {
  return (
    pathname.startsWith("/connect") ||
    pathname.startsWith("/business/onboarding") ||
    pathname.startsWith("/invite/")
  );
}

export function needsOnboardingRedirect(
  role: UserRole,
  onboarding: OnboardingStatus,
  pathname: string,
  orgId?: string | null,
): string | null {
  if (isOnboardingRoute(pathname)) return null;

  if (role === "parent" && onboarding === "pending_link") {
    return "/connect";
  }
  if (role === "business_admin" && needsBusinessOnboarding(orgId)) {
    return "/business/onboarding";
  }
  return null;
}
