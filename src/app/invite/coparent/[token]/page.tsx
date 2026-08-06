import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";
import { BezelCard } from "@/components/marketing/bezel-card";
import { Button } from "@/components/ui/button";
import {
  acceptCoparentInvite,
  getCoparentInviteByToken,
} from "@/lib/coparent/coparent-service";
import { createClient } from "@/lib/supabase/server";

type CoparentInvitePageProps = {
  params: Promise<{ token: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("parent.family.coparent.invite");
  return { title: t("metaTitle") };
}

export default async function CoparentInvitePage({ params }: CoparentInvitePageProps) {
  const { token } = await params;
  const t = await getTranslations("parent.family.coparent.invite");
  const preview = await getCoparentInviteByToken(token);

  if (!preview) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (preview.used) {
    return (
      <AuthShell title={t("usedTitle")} subtitle={t("usedSubtitle")}>
        <Link href="/login" className="text-sm font-medium text-primary hover:underline">
          {t("login")}
        </Link>
      </AuthShell>
    );
  }

  if (preview.expired) {
    return (
      <AuthShell title={t("expiredTitle")} subtitle={t("expiredSubtitle")}>
        <Link href="/support" className="text-sm font-medium text-primary hover:underline">
          {t("contactSupport")}
        </Link>
      </AuthShell>
    );
  }

  const childName = `${preview.childFirstName} ${preview.childLastName}`.trim();
  const subtitle = t("subtitle", {
    child: childName,
    parent: preview.primaryParentName ?? t("primaryParent"),
    permission: t(`permission.${preview.permission}`),
  });

  if (!user) {
    return (
      <AuthShell title={t("title")} subtitle={subtitle} className="max-w-lg">
        <BezelCard className="mb-6 space-y-2 p-5">
          <p className="text-sm text-muted-foreground">{t("signInHint")}</p>
        </BezelCard>
        <LoginForm returnTo={`/invite/coparent/${token}`} />
        <p className="mt-6 text-center text-sm text-muted-foreground">
          {t("noAccount")}{" "}
          <Link href={`/sign-up/parent?returnTo=/invite/coparent/${token}`} className="text-primary hover:underline">
            {t("signUp")}
          </Link>
        </p>
      </AuthShell>
    );
  }

  const wrongEmail =
    user.email?.toLowerCase() !== preview.inviteEmail.toLowerCase();

  if (wrongEmail) {
    return (
      <AuthShell title={t("wrongEmailTitle")} subtitle={t("wrongEmailSubtitle", { email: preview.inviteEmail })} className="max-w-lg">
        <p className="text-sm text-muted-foreground">
          {t("signedInAs", { email: user.email ?? "" })}
        </p>
        <Link href="/login" className="mt-4 inline-block text-sm font-medium text-primary hover:underline">
          {t("switchAccount")}
        </Link>
      </AuthShell>
    );
  }

  async function acceptAction() {
    "use server";
    const supabase = await createClient();
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();
    if (!currentUser) redirect(`/invite/coparent/${token}`);

    const result = await acceptCoparentInvite(
      currentUser.id,
      currentUser.email ?? null,
      token,
    );
    if (result.ok) redirect("/parent/today");
    redirect(`/invite/coparent/${token}`);
  }

  return (
    <AuthShell title={t("title")} subtitle={subtitle} className="max-w-lg">
      <form action={acceptAction}>
        <BezelCard className="space-y-4 p-6">
          <p className="text-sm leading-relaxed text-muted-foreground">{t("body")}</p>
          <Button type="submit" className="min-h-11 w-full rounded-full">
            {t("acceptCta")}
          </Button>
        </BezelCard>
      </form>
    </AuthShell>
  );
}
