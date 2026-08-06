"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/business/page-header";
import { BezelCard } from "@/components/marketing/bezel-card";
import { signOutAction } from "@/lib/auth/actions";

type ParentAccountWorkspaceProps = {
  email: string;
  displayName: string;
};

export function ParentAccountWorkspace({
  email,
  displayName,
}: ParentAccountWorkspaceProps) {
  const t = useTranslations("parent.you.account");

  return (
    <div className="space-y-8">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <BezelCard className="p-6 md:p-8">
        <p className="text-sm text-muted-foreground">{t("signedInAs")}</p>
        <p className="mt-1 font-display text-xl text-foreground">{displayName}</p>
        <p className="mt-1 text-sm text-muted-foreground">{email}</p>
      </BezelCard>

      <div className="grid gap-3 md:grid-cols-2">
        <Link
          href="/forgot-password"
          className="block rounded-[1.25rem] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <BezelCard className="p-5 transition-[box-shadow,transform] duration-[220ms] ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-px hover:shadow-soft md:p-6">
            <p className="font-display text-lg text-foreground">{t("passwordTitle")}</p>
            <p className="mt-2 text-sm text-muted-foreground">{t("passwordBody")}</p>
          </BezelCard>
        </Link>

        <BezelCard className="flex flex-col justify-between p-5 md:p-6">
          <div>
            <p className="font-display text-lg text-foreground">{t("signOutTitle")}</p>
            <p className="mt-2 text-sm text-muted-foreground">{t("signOutBody")}</p>
          </div>
          <form action={signOutAction} className="mt-5">
            <button
              type="submit"
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-border/70 px-5 text-sm font-medium text-foreground transition-[transform,background-color] duration-[220ms] ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-secondary/80 active:scale-[0.98]"
            >
              {t("signOutCta")}
            </button>
          </form>
        </BezelCard>
      </div>

      <Link
        href="/parent/you"
        className="inline-flex text-sm text-muted-foreground transition-colors duration-200 hover:text-foreground"
      >
        {t("backToYou")}
      </Link>
    </div>
  );
}
