import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AuthPageFooter } from "@/components/auth/auth-page-footer";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";

type AdminLoginPageProps = {
  searchParams: Promise<{ returnTo?: string; redirect?: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth");
  return { title: t("adminLoginTitle") };
}

export default async function AdminLoginPage({
  searchParams,
}: AdminLoginPageProps) {
  const t = await getTranslations("auth");
  const params = await searchParams;
  const returnTo = params.returnTo ?? params.redirect;

  return (
    <AuthShell
      title={t("adminLoginTitle")}
      subtitle={t("adminLoginSubtitle")}
      footer={<AuthPageFooter />}
    >
      <LoginForm returnTo={returnTo} variant="admin" intent="admin" />
    </AuthShell>
  );
}
