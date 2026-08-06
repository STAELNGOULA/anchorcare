import { NextResponse } from "next/server";
import { logAuthEvent } from "@/lib/auth/audit";
import { resolvePostAuthPath } from "@/lib/auth/onboarding";
import { parseReturnTo } from "@/lib/auth/return-to";
import { isValidRedirectPath } from "@/lib/auth/redirect-path";
import { isUserRole } from "@/lib/auth/roles";
import { finalizeSignupProfile } from "@/lib/auth/signup-service";
import {
  clearReferralCode,
  readReferralCode,
} from "@/lib/referrals/referral-cookie";
import { recordReferralAttribution } from "@/lib/referrals/referral-service";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";
  const returnTo = searchParams.get("returnTo");
  const rawDestination = returnTo ?? next;
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? undefined;

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
        const service = createServiceClient();
        const now = new Date().toISOString();
        await service
          .from("profiles")
          .update({
            last_login_at: now,
            email_verified_at: data.user.email_confirmed_at ?? now,
            updated_at: now,
          })
          .eq("id", data.user.id);
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select(
          "role, onboarding_status, account_status, terms_accepted_at, country, region, org_id",
        )
        .eq("id", data.user.id)
        .maybeSingle();

      const signupIntent = request.headers
        .get("cookie")
        ?.match(/ANCHOR_SIGNUP_INTENT=(parent|program)/)?.[1];
      const signupSourceCookie = request.headers
        .get("cookie")
        ?.match(/ANCHOR_SIGNUP_SOURCE=(organic|public_page|invite)/)?.[1];

      let activeProfile = profile;

      if (
        signupIntent &&
        (signupIntent === "parent" || signupIntent === "program") &&
        !profile?.terms_accepted_at
      ) {
        const role = signupIntent === "program" ? "business_admin" : "parent";
        const onboardingStatus =
          signupIntent === "program" ? "program_setup" : "pending_link";

        await finalizeSignupProfile({
          userId: data.user.id,
          role,
          fullName: data.user.user_metadata?.full_name ?? data.user.email ?? "",
          country: (profile?.country as "US" | "CA" | null) ?? "US",
          region: profile?.region ?? "NY",
          signupSource:
            signupSourceCookie === "public_page" ||
            signupSourceCookie === "invite"
              ? signupSourceCookie
              : "organic",
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

        const { data: refreshed } = await supabase
          .from("profiles")
          .select(
            "role, onboarding_status, account_status, terms_accepted_at, country, region, org_id",
          )
          .eq("id", data.user.id)
          .maybeSingle();
        if (refreshed) activeProfile = refreshed;
      }

      if (activeProfile?.account_status === "suspended") {
        await supabase.auth.signOut();
        await logAuthEvent({
          eventType: "oauth_fail",
          userId: data.user.id,
          ip,
          metadata: { reason: "account_suspended" },
        });
        return NextResponse.redirect(`${origin}/login?error=suspended`);
      }

      await logAuthEvent({
        eventType: "oauth_success",
        userId: data.user.id,
        ip,
      });

      let destination = "/parent/today";
      if (activeProfile?.role && isUserRole(activeProfile.role)) {
        destination = resolvePostAuthPath(
          activeProfile.role,
          activeProfile.onboarding_status ?? "active",
          activeProfile.org_id,
        );
      }

      const parsedReturn = parseReturnTo(
        isValidRedirectPath(rawDestination) ? rawDestination : null,
      );
      if (parsedReturn) {
        destination = parsedReturn.path;
      }

      return NextResponse.redirect(`${origin}${destination}`);
    }

    await logAuthEvent({
      eventType: "oauth_fail",
      ip,
      metadata: { reason: error?.message ?? "exchange_failed" },
    });

    if (next === "/reset-password" || rawDestination === "/reset-password") {
      return NextResponse.redirect(`${origin}/reset-password?error=expired`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback`);
}
