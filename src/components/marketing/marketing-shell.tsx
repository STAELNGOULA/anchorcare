import Link from "next/link";
import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";
import { SkipLink } from "@/components/marketing/skip-link";

type MarketingShellProps = {
  children: ReactNode;
};

export async function getMarketingLabels() {
  const t = await getTranslations("landing");
  const common = await getTranslations("common");

  return {
    header: {
      navHowItWorks: t("navHowItWorks"),
      navSupport: t("navSupport"),
      navForParents: t("navForParents"),
      navForPrograms: t("navForPrograms"),
      ctaRegister: t("ctaRegister"),
      ctaLogin: t("ctaLogin"),
      menuOpen: t("menuOpen"),
      menuClose: t("menuClose"),
    },
    footer: {
      appName: common("appName"),
      footerTagline: t("footerTagline"),
      footerProduct: t("footerProduct"),
      footerTrust: t("footerTrust"),
      footerCompany: t("footerCompany"),
      footerPrograms: t("footerPrograms"),
      footerParents: t("footerParents"),
      footerSignIn: t("footerSignIn"),
      footerPrivacy: t("footerPrivacy"),
      footerTerms: t("footerTerms"),
      footerContact: t("footerContact"),
      footerSupport: t("footerSupport"),
      footerRights: t("footerRights"),
    },
    skipLink: t("skipToContent"),
  };
}

export async function MarketingShell({ children }: MarketingShellProps) {
  const labels = await getMarketingLabels();

  return (
    <div className="relative min-h-[100dvh] bg-background">
      <SkipLink label={labels.skipLink} />
      <div className="grain-overlay pointer-events-none fixed inset-0 z-0" aria-hidden />
      <div className="relative z-10">
        <SiteHeader labels={labels.header} />
        {children}
        <SiteFooter labels={labels.footer} />
      </div>
    </div>
  );
}

export function MarketingBackLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-11 items-center text-sm font-medium text-muted-foreground transition-colors duration-300 ease-premium hover:text-foreground"
    >
      {children}
    </Link>
  );
}
