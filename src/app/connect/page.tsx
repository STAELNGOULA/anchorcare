import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AuthShell } from "@/components/auth/auth-shell";
import { ConnectInviteForm } from "@/components/auth/connect-invite-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth");
  return { title: t("connectTitle") };
}

export default async function ConnectPage() {
  const t = await getTranslations("auth");

  return (
    <AuthShell
      title={t("connectTitle")}
      subtitle={t("connectSubtitle")}
      backHref="/support"
      backLabel={t("contactSupport")}
    >
      <ConnectInviteForm />
    </AuthShell>
  );
}
