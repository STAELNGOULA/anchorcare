import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";

type LoginPageProps = {
  searchParams: Promise<{ redirect?: string; error?: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth");
  return { title: t("loginTitle") };
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const t = await getTranslations("auth");
  const params = await searchParams;

  return (
    <AuthShell
      title={t("loginTitle")}
      subtitle={t("loginSubtitle")}
      backHref="/"
      backLabel={t("backHome")}
    >
      {params.error === "auth_callback" ? (
        <p className="mb-5 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {t("authCallbackError")}
        </p>
      ) : null}
      <LoginForm redirect={params.redirect} />
    </AuthShell>
  );
}
