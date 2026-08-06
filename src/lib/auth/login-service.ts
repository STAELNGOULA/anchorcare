import { logAuthEvent } from "@/lib/auth/audit";
import { acceptInviteForUser } from "@/lib/auth/invites";
import { resolvePostAuthPath } from "@/lib/auth/onboarding";
import { pickReturnPath } from "@/lib/auth/return-to";
import { isUserRole } from "@/lib/auth/roles";
import {
  checkLoginRateLimit,
  clearLoginRateLimit,
  recordLoginFailure,
} from "@/lib/auth/rate-limit";
import { loginSchema } from "@/lib/auth/validation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { cookies } from "next/headers";
import type { z } from "zod";

const REMEMBER_MAX_AGE = 60 * 60 * 24 * 30;

export type LoginErrorCode =
  | "invalidCredentials"
  | "emailNotVerified"
  | "accountSuspended"
  | "rateLimited"
  | "adminIpBlocked"
  | "validationError"
  | "unknownError";

export type LoginResult =
  | { ok: true; redirect: string }
  | {
      ok: false;
      code: LoginErrorCode;
      fieldErrors?: Record<string, string>;
      retryAfterSeconds?: number;
    };

type LoginContext = {
  ip: string;
  userAgent?: string;
  requireAdminRole?: boolean;
};

function firstZodError(
  fieldErrors: Record<string, string[] | undefined>,
): Record<string, string> {
  const entry = Object.entries(fieldErrors)[0];
  if (!entry) return {};
  return { [entry[0]]: entry[1]?.[0] ?? "unknownError" };
}

function isAdminIpAllowed(ip: string): boolean {
  const raw = process.env.ADMIN_LOGIN_IP_ALLOWLIST;
  if (!raw?.trim()) return true;
  const allowed = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return allowed.includes(ip);
}

async function updateProfileOnLogin(
  userId: string,
  emailVerified: boolean,
): Promise<{
  accountStatus: string;
  role: string;
  onboardingStatus: string;
  orgId: string | null;
} | null> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return null;

  const supabase = createServiceClient();
  const now = new Date().toISOString();

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, onboarding_status, account_status, org_id")
    .eq("id", userId)
    .maybeSingle();

  await supabase
    .from("profiles")
    .update({
      last_login_at: now,
      ...(emailVerified ? { email_verified_at: now } : {}),
      updated_at: now,
    })
    .eq("id", userId);

  if (!profile) return null;

  return {
    accountStatus: profile.account_status,
    role: profile.role,
    onboardingStatus: profile.onboarding_status,
    orgId: profile.org_id ?? null,
  };
}

async function setRememberDeviceCookie(remember: boolean): Promise<void> {
  const cookieStore = await cookies();
  if (remember) {
    cookieStore.set("anchor_remember_device", "1", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: REMEMBER_MAX_AGE,
      path: "/",
    });
  } else {
    cookieStore.delete("anchor_remember_device");
  }
}

export async function performLogin(
  input: z.infer<typeof loginSchema>,
  context: LoginContext,
): Promise<LoginResult> {
  if (context.requireAdminRole && !isAdminIpAllowed(context.ip)) {
    await logAuthEvent({
      eventType: "login_fail",
      email: input.email,
      ip: context.ip,
      userAgent: context.userAgent,
      metadata: { reason: "admin_ip_blocked" },
    });
    return { ok: false, code: "adminIpBlocked" };
  }

  const rateCheck = await checkLoginRateLimit(context.ip, input.email);
  if (!rateCheck.allowed) {
    return {
      ok: false,
      code: "rateLimited",
      retryAfterSeconds: rateCheck.retryAfterSeconds,
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: input.email,
    password: input.password,
  });

  if (error || !data.user) {
    await recordLoginFailure(context.ip, input.email);
    await logAuthEvent({
      eventType: "login_fail",
      email: input.email,
      ip: context.ip,
      userAgent: context.userAgent,
      metadata: { reason: error?.message ?? "no_user" },
    });

    if (error?.message.toLowerCase().includes("email not confirmed")) {
      return { ok: false, code: "emailNotVerified" };
    }

    return { ok: false, code: "invalidCredentials" };
  }

  const user = data.user;
  const emailVerified = Boolean(user.email_confirmed_at);

  if (!emailVerified) {
    await supabase.auth.signOut();
    await recordLoginFailure(context.ip, input.email);
    await logAuthEvent({
      eventType: "login_fail",
      userId: user.id,
      email: input.email,
      ip: context.ip,
      userAgent: context.userAgent,
      metadata: { reason: "email_not_verified" },
    });
    return { ok: false, code: "emailNotVerified" };
  }

  const profile = await updateProfileOnLogin(user.id, emailVerified);

  if (profile?.accountStatus === "suspended") {
    await supabase.auth.signOut();
    await logAuthEvent({
      eventType: "login_fail",
      userId: user.id,
      email: input.email,
      ip: context.ip,
      userAgent: context.userAgent,
      metadata: { reason: "account_suspended" },
    });
    return { ok: false, code: "accountSuspended" };
  }

  if (
    context.requireAdminRole &&
    profile?.role !== "admin"
  ) {
    await supabase.auth.signOut();
    await logAuthEvent({
      eventType: "login_fail",
      userId: user.id,
      email: input.email,
      ip: context.ip,
      userAgent: context.userAgent,
      metadata: { reason: "not_admin" },
    });
    return { ok: false, code: "invalidCredentials" };
  }

  if (input.inviteToken) {
    const inviteResult = await acceptInviteForUser(input.inviteToken, user.id);
    if (!inviteResult.ok) {
      await supabase.auth.signOut();
      return { ok: false, code: "unknownError" };
    }
  }

  await clearLoginRateLimit(context.ip, input.email);
  await setRememberDeviceCookie(Boolean(input.rememberDevice));

  await logAuthEvent({
    eventType: "login_success",
    userId: user.id,
    email: input.email,
    ip: context.ip,
    userAgent: context.userAgent,
    metadata: {
      returnTo: input.returnTo ?? input.redirect ?? null,
      admin: context.requireAdminRole ?? false,
    },
  });

  const role =
    profile?.role && isUserRole(profile.role) ? profile.role : "parent";
  const onboarding =
    (profile?.onboardingStatus as "pending_link" | "program_setup" | "active") ??
    "active";

  const roleHome = resolvePostAuthPath(role, onboarding, profile?.orgId ?? null);
  const returnPath = input.returnTo ?? input.redirect;
  const redirect = pickReturnPath(returnPath, roleHome);

  return { ok: true, redirect };
}

export function parseLoginBody(
  body: unknown,
):
  | { ok: true; data: z.infer<typeof loginSchema> }
  | { ok: false; fieldErrors: Record<string, string> } {
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return { ok: false, fieldErrors: firstZodError(parsed.error.flatten().fieldErrors) };
  }
  return { ok: true, data: parsed.data };
}
