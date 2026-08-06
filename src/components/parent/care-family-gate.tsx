import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { BezelCard } from "@/components/marketing/bezel-card";
import { getParentEntitlements } from "@/lib/billing/entitlements";
import { getParentContext } from "@/lib/parent/parent-context";

type CareFamilyGateProps = {
  children: ReactNode;
};

export async function CareFamilyGate({ children }: CareFamilyGateProps) {
  const context = await getParentContext();
  const entitlements = await getParentEntitlements(
    context.userId,
    context.childrenCount,
  );

  if (entitlements.canAccessCare) {
    return children;
  }

  const t = await getTranslations("parent.care.upgrade");

  return (
    <BezelCard className="mx-auto max-w-xl space-y-4 p-8 text-center md:p-10">
      <p className="font-display text-2xl text-foreground">{t("title")}</p>
      <p className="text-sm leading-relaxed text-muted-foreground">{t("body")}</p>
      <Link
        href="/parent/you/subscription"
        className="inline-flex min-h-11 items-center justify-center rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground transition-[transform,background-color] duration-[220ms] ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-primary/92 active:scale-[0.98]"
      >
        {t("cta")}
      </Link>
    </BezelCard>
  );
}
