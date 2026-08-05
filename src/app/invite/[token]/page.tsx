import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { InviteAcceptButton } from "@/components/auth/invite-accept-button";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";
import { SignUpForm } from "@/components/auth/sign-up-form";
import { getInviteByToken, toInvitePreview } from "@/lib/auth/invites";
import { createClient } from "@/lib/supabase/server";

type InvitePageProps = {
  params: Promise<{ token: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth");
  return { title: t("inviteTitle") };
}

export default async function InvitePage({ params }: InvitePageProps) {
  const t = await getTranslations("auth");
  const { token } = await params;
  const invite = await getInviteByToken(token);

  if (!invite) notFound();

  const preview = toInvitePreview(invite);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (preview.used) {
    return (
      <AuthShell title={t("inviteUsedTitle")} subtitle={t("inviteUsedSubtitle")}>
        <Link href="/login" className="text-sm font-medium text-primary hover:underline">
          {t("login")}
        </Link>
      </AuthShell>
    );
  }

  if (preview.expired) {
    return (
      <AuthShell
        title={t("inviteExpiredTitle")}
        subtitle={t("inviteExpiredSubtitle")}
      >
        <Link href="/support" className="text-sm font-medium text-primary hover:underline">
          {t("contactSupport")}
        </Link>
      </AuthShell>
    );
  }

  const childLine = preview.childFirstName
    ? t("inviteChildLine", { child: preview.childFirstName })
    : null;

  return (
    <AuthShell
      title={t("inviteTitle")}
      subtitle={t("inviteSubtitle", { program: preview.programName })}
    >
      <div className="mb-6 space-y-2 rounded-xl bg-secondary/50 px-4 py-4 text-sm text-foreground">
        <p className="font-medium">{preview.programName}</p>
        {childLine ? <p className="text-muted-foreground">{childLine}</p> : null}
        {preview.email ? (
          <p className="text-muted-foreground">
            {t("inviteEmailHint", { email: preview.email })}
          </p>
        ) : null}
      </div>

      {user ? (
        <InviteAcceptButton token={token} />
      ) : (
        <div className="space-y-8">
          <div>
            <h2 className="mb-4 font-display text-xl text-foreground">
              {t("inviteCreateAccount")}
            </h2>
            <SignUpForm intent="parent" inviteToken={token} />
          </div>
          <div className="border-t border-border/40 pt-8">
            <h2 className="mb-4 font-display text-xl text-foreground">
              {t("inviteHaveAccount")}
            </h2>
            <LoginForm inviteToken={token} />
          </div>
        </div>
      )}
    </AuthShell>
  );
}
