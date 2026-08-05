"use server";

import { acceptInviteForUser } from "@/lib/auth/invites";
import { resolvePostAuthPath } from "@/lib/auth/onboarding";
import { isValidRedirectPath } from "@/lib/auth/redirect-path";
import { isUserRole } from "@/lib/auth/roles";
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
    .select("role, onboarding_status")
    .eq("id", userId)
    .maybeSingle();

  if (profile?.role && isUserRole(profile.role)) {
    return resolvePostAuthPath(
      profile.role,
      profile.onboarding_status ?? "active",
    );
  }
  return "/parent/today";
}

export async function signInAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    redirect: formData.get("redirect")?.toString() || undefined,
  });

  if (!parsed.success) {
    return firstZodError(parsed.error.flatten().fieldErrors);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    if (error.message.toLowerCase().includes("email not confirmed")) {
      return { error: "emailNotVerified" };
    }
    return { error: "invalidCredentials" };
  }

  if (!data.user) return { error: "invalidCredentials" };

  const inviteToken = formData.get("inviteToken")?.toString();
  if (inviteToken) {
    const result = await acceptInviteForUser(inviteToken, data.user.id);
    if (!result.ok) return { error: result.code };
  }

  const home = await profileRedirectPath(data.user.id);
  if (parsed.data.redirect && isValidRedirectPath(parsed.data.redirect)) {
    redirect(parsed.data.redirect);
  }
  redirect(home);
}

export async function signUpAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = signUpSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
    intent: formData.get("intent"),
    inviteToken: formData.get("inviteToken")?.toString() || undefined,
    acceptTerms: formData.get("acceptTerms"),
  });

  if (!parsed.success) {
    return firstZodError(parsed.error.flatten().fieldErrors);
  }

  const { fullName, email, password, intent, inviteToken } = parsed.data;
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

  if (error) {
    if (error.message.toLowerCase().includes("already registered")) {
      return { error: "emailTaken" };
    }
    return { error: "signUpFailed" };
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

  const origin = await getOrigin();
  const supabase = await createClient();

  const { error } = await supabase.auth.resetPasswordForEmail(
    parsed.data.email,
    {
      redirectTo: `${origin}/auth/callback?next=/reset-password`,
    },
  );

  if (error) return { error: "resetEmailFailed" };

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

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "sessionExpired" };

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) return { error: "resetFailed" };

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

  const result = await acceptInviteForUser(token, user.id);
  if (!result.ok) return { error: result.code };

  redirect("/parent/today");
}

export async function completeProgramOnboarding(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  await supabase
    .from("profiles")
    .update({ onboarding_status: "active" })
    .eq("id", user.id);

  redirect("/business/dashboard");
}

export async function signOutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
