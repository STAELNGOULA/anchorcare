import type { Metadata } from "next";
import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";
import { AuthPageFooter } from "@/components/auth/auth-page-footer";
import { AuthShell } from "@/components/auth/auth-shell";
import { SignUpForm } from "@/components/auth/sign-up-form";
import { SignUpIntentPicker } from "@/components/auth/sign-up-intent-picker";
import { SignUpIntentTabs } from "@/components/auth/sign-up-intent-tabs";
import { SignUpPageFooter } from "@/components/auth/sign-up-page-footer";
import { SignupStepIndicator } from "@/components/auth/signup-step-indicator";
import { readSignupSource } from "@/lib/auth/signup-source";
import {
  normalizeReferralCode,
  referralCookieOptions,
} from "@/lib/referrals/referral-cookie";

type SignUpPageProps = {
  searchParams: Promise<{
    intent?: string;
    invite?: string;
    returnTo?: string;
    ref?: string;
  }>;
};

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth");
  return { title: t("signUpTitle") };
}

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  const t = await getTranslations("auth");
  const params = await searchParams;
  const inviteToken = params.invite;
  const intentParam = params.intent;
  const signupSource = await readSignupSource();

  const referralCode = normalizeReferralCode(params.ref);
  if (referralCode) {
    const cookieStore = await cookies();
    cookieStore.set("ANCHOR_REFERRAL_CODE", referralCode, referralCookieOptions());
  }

  if (!intentParam && !inviteToken) {
    return (
      <AuthShell
        title={t("signUpChooseTitle")}
        subtitle={t("signUpChooseSubtitle")}
        backHref="/"
        backLabel={t("backHome")}
        footer={<AuthPageFooter />}
      >
        <SignUpIntentPicker />
      </AuthShell>
    );
  }

  const intent = intentParam === "program" ? "program" : "parent";
  const isProgram = intent === "program";

  return (
    <AuthShell
      title={isProgram ? t("signUpProgramTitle") : t("signUpParentTitle")}
      subtitle={isProgram ? t("signUpProgramSubtitle") : t("signUpParentSubtitle")}
      backHref="/"
      backLabel={t("backHome")}
    >
      {isProgram ? (
        <SignupStepIndicator
          currentStep={1}
          totalSteps={4}
          label={t("signupStepAccount")}
        />
      ) : null}

      {!inviteToken ? (
        <SignUpIntentTabs
          active={intent}
          parentLabel={t("intentTabParent")}
          programLabel={t("intentTabProgram")}
        />
      ) : null}

      {!isProgram && !inviteToken ? (
        <p className="mb-5 rounded-xl bg-secondary/60 px-4 py-3 text-sm text-muted-foreground">
          {t("parentSignupNote")}
        </p>
      ) : null}

      <SignUpForm
        intent={intent}
        inviteToken={inviteToken}
        signupSource={signupSource}
        returnTo={params.returnTo}
      />

      <SignUpPageFooter intent={intent} />
    </AuthShell>
  );
}
