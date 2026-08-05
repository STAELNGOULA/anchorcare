import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AuthShell } from "@/components/auth/auth-shell";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth");
  return { title: t("forgotPasswordTitle") };
}

export default async function ForgotPasswordPage() {
  const t = await getTranslations("auth");

  return (
    <AuthShell
      title={t("forgotPasswordTitle")}
      subtitle={t("forgotPasswordSubtitle")}
      backHref="/login"
      backLabel={t("backToLogin")}
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
