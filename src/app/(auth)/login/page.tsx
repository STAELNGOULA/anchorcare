import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AuthPageFooter } from "@/components/auth/auth-page-footer";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";

type LoginPageProps = {
  searchParams: Promise<{
    returnTo?: string;
    redirect?: string;
    error?: string;
    intent?: string;
    email?: string;
  }>;
};

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth");
  return { title: t("loginTitle") };
}

function resolveIntent(
  intent?: string,
): "parent" | "program" | "admin" | undefined {
  if (intent === "program" || intent === "parent" || intent === "admin") {
    return intent;
  }
  return undefined;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const t = await getTranslations("auth");
  const params = await searchParams;
  const returnTo = params.returnTo ?? params.redirect;
  const intent = resolveIntent(params.intent);

  const subtitle =
    intent === "program"
      ? t("loginSubtitleProgram")
      : intent === "parent"
        ? t("loginSubtitleParent")
        : t("loginSubtitle");

  return (
    <AuthShell
      title={t("loginTitle")}
      subtitle={subtitle}
      backHref="/"
      backLabel={t("backHome")}
      footer={<AuthPageFooter />}
    >
      {params.error === "auth_callback" ? (
        <p className="mb-5 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {t("authCallbackError")}
        </p>
      ) : null}
      {params.error === "suspended" ? (
        <p className="mb-5 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {t("suspendedBody")}
        </p>
      ) : null}
      <LoginForm returnTo={returnTo} intent={intent} initialEmail={params.email} />
    </AuthShell>
  );
}
