import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AuthShell } from "@/components/auth/auth-shell";
import { SignUpForm } from "@/components/auth/sign-up-form";
import { SignUpIntentPicker } from "@/components/auth/sign-up-intent-picker";
import { SignUpIntentTabs } from "@/components/auth/sign-up-intent-tabs";
import { SignUpPageFooter } from "@/components/auth/sign-up-page-footer";

type SignUpPageProps = {
  searchParams: Promise<{ intent?: string; invite?: string }>;
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

  if (!intentParam && !inviteToken) {
    return (
      <AuthShell
        title={t("signUpChooseTitle")}
        subtitle={t("signUpChooseSubtitle")}
        backHref="/"
        backLabel={t("backHome")}
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

      <SignUpForm intent={intent} inviteToken={inviteToken} />

      <SignUpPageFooter intent={intent} />
    </AuthShell>
  );
}
