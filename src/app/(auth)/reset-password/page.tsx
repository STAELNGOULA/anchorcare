import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AuthPageFooter } from "@/components/auth/auth-page-footer";
import { AuthShell } from "@/components/auth/auth-shell";
import { ResetExpiredState } from "@/components/auth/reset-expired-state";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { createClient } from "@/lib/supabase/server";

type ResetPasswordPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth");
  return { title: t("resetPasswordTitle") };
}

export default async function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps) {
  const t = await getTranslations("auth");
  const params = await searchParams;
  const isExpired = params.error === "expired";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const showExpired = isExpired || !user;

  return (
    <AuthShell
      title={
        showExpired ? t("resetExpiredTitle") : t("resetPasswordTitle")
      }
      subtitle={
        showExpired ? t("resetExpiredSubtitle") : t("resetPasswordSubtitle")
      }
      backHref="/login"
      backLabel={t("backToLogin")}
      footer={<AuthPageFooter />}
    >
      {showExpired ? <ResetExpiredState /> : <ResetPasswordForm />}
    </AuthShell>
  );
}
