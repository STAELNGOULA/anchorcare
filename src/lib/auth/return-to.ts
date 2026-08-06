import { isValidRedirectPath } from "@/lib/auth/redirect-path";

export type ReturnToIntent =
  | "public_register"
  | "invite"
  | "sms_report"
  | "generic";

export type ParsedReturnTo = {
  path: string;
  intent: ReturnToIntent;
};

/**
 * Resolve returnTo / redirect query param with intent classification.
 * Honors public book-and-pay, invite, and SMS report deep links.
 */
export function parseReturnTo(
  raw: string | null | undefined,
): ParsedReturnTo | null {
  if (!raw || !isValidRedirectPath(raw)) return null;

  if (raw.startsWith("/p/") && raw.includes("/programs/")) {
    return { path: raw, intent: "public_register" };
  }
  if (raw.startsWith("/p/")) {
    return { path: raw, intent: "public_register" };
  }
  if (raw.startsWith("/invite/")) {
    return { path: raw, intent: "invite" };
  }
  if (raw.startsWith("/r/")) {
    return { path: raw, intent: "sms_report" };
  }
  if (raw.startsWith("/connect")) {
    return { path: raw, intent: "invite" };
  }

  return { path: raw, intent: "generic" };
}

export function pickReturnPath(
  returnTo: string | null | undefined,
  roleHome: string,
): string {
  const parsed = parseReturnTo(returnTo);
  return parsed?.path ?? roleHome;
}
