import { cookies } from "next/headers";

export type SignupSource = "organic" | "public_page" | "invite";

const COOKIE_NAME = "ANCHOR_SIGNUP_SOURCE";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export function signupSourceCookieOptions() {
  return {
    path: "/",
    maxAge: MAX_AGE,
    sameSite: "lax" as const,
    httpOnly: true,
  };
}

export async function readSignupSource(): Promise<SignupSource> {
  const cookieStore = await cookies();
  const value = cookieStore.get(COOKIE_NAME)?.value;
  if (value === "public_page" || value === "invite" || value === "organic") {
    return value;
  }
  return "organic";
}

export function resolveSignupSource(input: {
  inviteToken?: string;
  cookieSource: SignupSource;
  intent: "parent" | "program";
}): SignupSource {
  if (input.inviteToken) return "invite";
  return input.cookieSource;
}
