import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth");
  return { title: t("resetPasswordTitle") };
}

export default async function ResetPasswordPage() {
  const t = await getTranslations("auth");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/forgot-password");
  }

  return (
    <AuthShell
      title={t("resetPasswordTitle")}
      subtitle={t("resetPasswordSubtitle")}
      backHref="/login"
      backLabel={t("backToLogin")}
    >
      <ResetPasswordForm />
    </AuthShell>
  );
}
