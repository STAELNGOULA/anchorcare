import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";
import { SignUpForm } from "@/components/auth/sign-up-form";
import { InviteBrandedHeader } from "@/components/invite/invite-branded-header";
import { InviteAcceptPanel } from "@/components/invite/invite-accept-panel";
import { CoachInviteAccept } from "@/components/invite/invite-coach-accept";
import { WrongAccountPanel } from "@/components/invite/wrong-account-panel";
import {
  emailsMatch,
  getInviteDetailByToken,
  isInviteExpired,
  isInviteUsed,
} from "@/lib/invites/invite-service";
import { getParentChildren } from "@/lib/invites/parent-children";
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
  const invite = await getInviteDetailByToken(token);

  if (!invite) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (isInviteUsed(invite)) {
    return (
      <AuthShell title={t("inviteUsedTitle")} subtitle={t("inviteUsedSubtitle")}>
        <Link href="/login" className="text-sm font-medium text-primary hover:underline">
          {t("login")}
        </Link>
      </AuthShell>
    );
  }

  if (isInviteExpired(invite)) {
    return (
      <AuthShell title={t("inviteExpiredTitle")} subtitle={t("inviteExpiredSubtitle")}>
        <Link href="/support" className="text-sm font-medium text-primary hover:underline">
          {t("contactSupport")}
        </Link>
      </AuthShell>
    );
  }

  const subtitle =
    invite.inviteType === "coach"
      ? t("inviteCoachSubtitle", { program: invite.programName })
      : t("inviteSubtitle", { program: invite.programName });

  const wrongAccount =
    user &&
    invite.email &&
    !emailsMatch(invite.email, user.email ?? null);

  const children = user && invite.inviteType === "parent" ? await getParentChildren(user.id) : [];

  return (
    <AuthShell title={t("inviteTitle")} subtitle={subtitle} className="max-w-lg">
      <InviteBrandedHeader invite={invite} className="mb-6" />

      {wrongAccount ? (
        <WrongAccountPanel
          token={token}
          inviteEmail={invite.email!}
          currentEmail={user!.email ?? ""}
        />
      ) : user ? (
        invite.inviteType === "coach" ? (
          <CoachInviteAccept token={token} userEmail={user.email ?? ""} />
        ) : (
          <InviteAcceptPanel
            token={token}
            invite={invite}
            children={children}
            userEmail={user.email ?? ""}
          />
        )
      ) : (
        <div className="space-y-8">
          {invite.email ? (
            <p className="text-sm text-muted-foreground">
              {t("inviteEmailHint", { email: invite.email })}
            </p>
          ) : null}
          <div>
            <h2 className="mb-4 font-display text-xl text-foreground">
              {t("inviteCreateAccount")}
            </h2>
            <SignUpForm intent="parent" inviteToken={token} signupSource="invite" showOAuth={false} />
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
