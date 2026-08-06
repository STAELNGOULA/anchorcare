import { cookies } from "next/headers";

const COOKIE_NAME = "ANCHOR_REFERRAL_CODE";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export function referralCookieOptions() {
  return {
    path: "/",
    maxAge: MAX_AGE,
    sameSite: "lax" as const,
    httpOnly: true,
  };
}

export async function readReferralCode(): Promise<string | null> {
  const cookieStore = await cookies();
  const value = cookieStore.get(COOKIE_NAME)?.value?.trim();
  if (!value || value.length > 32) return null;
  return value;
}

export async function clearReferralCode(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export function normalizeReferralCode(raw: string | undefined | null): string | null {
  const code = raw?.trim();
  if (!code || code.length > 32) return null;
  return code;
}
