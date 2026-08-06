"use server";

import { acceptInviteForUser } from "@/lib/auth/invites";
import { logAuthEvent } from "@/lib/auth/audit";
import { performLogin } from "@/lib/auth/login-service";
import { resolvePostAuthPath } from "@/lib/auth/onboarding";
import { isPasswordStrongEnough } from "@/lib/auth/password-strength";
import { isUserRole } from "@/lib/auth/roles";
import {
  checkPasswordResetRateLimit,
  checkSignupRateLimit,
  recordPasswordResetRequest,
  recordSignupAttempt,
} from "@/lib/auth/rate-limit";
import {
  readSignupSource,
  resolveSignupSource,
} from "@/lib/auth/signup-source";
import { finalizeSignupProfile } from "@/lib/auth/signup-service";
import {
  clearReferralCode,
  readReferralCode,
} from "@/lib/referrals/referral-cookie";
import { recordReferralAttribution } from "@/lib/referrals/referral-service";
import {
  forgotPasswordSchema,
  loginSchema,
  resetPasswordSchema,
  signUpSchema,
} from "@/lib/auth/validation";
import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export type AuthActionState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  success?: string;
  retryAfterSeconds?: number;
  duplicateEmail?: string;
};

function firstZodError(
  fieldErrors: Record<string, string[] | undefined>,
): AuthActionState {
  const entry = Object.entries(fieldErrors)[0];
  if (!entry) return { error: "unknownError" };
  return { fieldErrors: { [entry[0]]: entry[1]?.[0] ?? "unknownError" } };
}

async function getOrigin(): Promise<string> {
  const headerStore = await headers();
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  const protocol = headerStore.get("x-forwarded-proto") ?? "http";
  if (!host) return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return `${protocol}://${host}`;
}

async function profileRedirectPath(
  userId: string,
): Promise<string> {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, onboarding_status, org_id")
    .eq("id", userId)
    .maybeSingle();

  if (profile?.role && isUserRole(profile.role)) {
    return resolvePostAuthPath(
      profile.role,
      profile.onboarding_status ?? "active",
      profile.org_id,
    );
  }
  return "/parent/today";
}

export async function signInAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const headerStore = await headers();
  const ip =
    headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    rememberDevice: formData.get("rememberDevice") === "on",
    redirect: formData.get("redirect")?.toString() || undefined,
    returnTo: formData.get("returnTo")?.toString() || undefined,
    inviteToken: formData.get("inviteToken")?.toString() || undefined,
  });

  if (!parsed.success) {
    return firstZodError(parsed.error.flatten().fieldErrors);
  }

  const result = await performLogin(parsed.data, {
    ip,
    userAgent: headerStore.get("user-agent") ?? undefined,
    requireAdminRole: formData.get("admin") === "1",
  });

  if (!result.ok) {
    if (result.fieldErrors) {
      return { fieldErrors: result.fieldErrors };
    }
    return {
      error: result.code,
      ...(result.retryAfterSeconds
        ? { retryAfterSeconds: result.retryAfterSeconds }
        : {}),
    };
  }

  redirect(result.redirect);
}

export async function signUpAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const honeypot = formData.get("company")?.toString().trim();
  if (honeypot) {
    return { success: "checkEmail" };
  }

  const headerStore = await headers();
  const ip =
    headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  const parsed = signUpSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
    intent: formData.get("intent"),
    country: formData.get("country"),
    region: formData.get("region"),
    inviteToken: formData.get("inviteToken")?.toString() || undefined,
    inviteCode: formData.get("inviteCode")?.toString() || undefined,
    signupSource: formData.get("signupSource")?.toString() || undefined,
    acceptTerms: formData.get("acceptTerms"),
    company: formData.get("company"),
  });

  if (!parsed.success) {
    return firstZodError(parsed.error.flatten().fieldErrors);
  }

  if (!isPasswordStrongEnough(parsed.data.password)) {
    return { fieldErrors: { password: "passwordWeak" } };
  }

  const rateLimit = await checkSignupRateLimit(ip);
  if (!rateLimit.allowed) {
    return {
      error: "signupRateLimited",
      retryAfterSeconds: rateLimit.retryAfterSeconds,
    };
  }

  const {
    fullName,
    email,
    password,
    intent,
    country,
    region,
    inviteCode,
  } = parsed.data;
  const inviteToken =
    parsed.data.inviteToken ||
    (inviteCode && inviteCode.length >= 8 ? inviteCode : undefined);

  const cookieSource = await readSignupSource();
  const signupSource = resolveSignupSource({
    inviteToken,
    cookieSource: parsed.data.signupSource ?? cookieSource,
    intent,
  });

  const role = intent === "program" ? "business_admin" : "parent";
  let onboardingStatus: "pending_link" | "program_setup" | "active" =
    intent === "program" ? "program_setup" : "pending_link";
  if (inviteToken) onboardingStatus = "active";

  const origin = await getOrigin();
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        role,
        full_name: fullName,
        onboarding_status: onboardingStatus,
      },
      emailRedirectTo: `${origin}/auth/callback?next=/login`,
    },
  });

  await recordSignupAttempt(ip);

  if (error) {
    await logAuthEvent({
      eventType: "signup_fail",
      email,
      ip,
      userAgent: headerStore.get("user-agent") ?? undefined,
      metadata: { reason: error.message },
    });
    if (error.message.toLowerCase().includes("already registered")) {
      return { error: "emailTaken", duplicateEmail: email };
    }
    return { error: "signUpFailed" };
  }

  if (data.user) {
    await finalizeSignupProfile({
      userId: data.user.id,
      role,
      fullName,
      country,
      region,
      signupSource,
      onboardingStatus,
    });

    const referralCode = await readReferralCode();
    if (referralCode) {
      await recordReferralAttribution({
        referredUserId: data.user.id,
        referralCode,
      });
      await clearReferralCode();
    }

    await logAuthEvent({
      eventType: "signup_success",
      userId: data.user.id,
      email,
      ip,
      userAgent: headerStore.get("user-agent") ?? undefined,
      metadata: { intent, signupSource },
    });
  }

  if (data.user && inviteToken) {
    const result = await acceptInviteForUser(inviteToken, data.user.id);
    if (!result.ok) return { error: result.code };
  }

  if (data.session && data.user) {
    const home = await profileRedirectPath(data.user.id);
    redirect(home);
  }

  return { success: "checkEmail" };
}

export async function forgotPasswordAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = forgotPasswordSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return firstZodError(parsed.error.flatten().fieldErrors);
  }

  const headerStore = await headers();
  const ip =
    headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ?? undefined;

  const rateLimit = await checkPasswordResetRateLimit(parsed.data.email);
  if (!rateLimit.allowed) {
    return {
      error: "resetRateLimited",
      retryAfterSeconds: rateLimit.retryAfterSeconds,
    };
  }

  const origin = await getOrigin();
  const supabase = await createClient();

  const { error } = await supabase.auth.resetPasswordForEmail(
    parsed.data.email,
    {
      redirectTo: `${origin}/auth/callback?next=/reset-password`,
    },
  );

  // Always show success — no account enumeration (spec P-02).
  if (!error) {
    await recordPasswordResetRequest(parsed.data.email);
    await logAuthEvent({
      eventType: "password_reset_requested",
      email: parsed.data.email,
      ip,
      userAgent: headerStore.get("user-agent") ?? undefined,
    });
  }

  return { success: "resetEmailSent" };
}

export async function resetPasswordAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = resetPasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return firstZodError(parsed.error.flatten().fieldErrors);
  }

  if (!isPasswordStrongEnough(parsed.data.password)) {
    return { fieldErrors: { password: "passwordWeak" } };
  }

  const headerStore = await headers();
  const ip =
    headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ?? undefined;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "sessionExpired" };

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) return { error: "resetFailed" };

  await supabase.auth.signOut({ scope: "others" });

  await logAuthEvent({
    eventType: "password_reset_completed",
    userId: user.id,
    email: user.email,
    ip,
    userAgent: headerStore.get("user-agent") ?? undefined,
  });

  const home = await profileRedirectPath(user.id);
  redirect(home);
}

export async function acceptInviteAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const token = formData.get("token")?.toString().trim();
  if (!token || token.length < 8) return { error: "inviteInvalid" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "notAuthenticated" };

  redirect(`/invite/${encodeURIComponent(token)}`);
}

export async function signOutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
