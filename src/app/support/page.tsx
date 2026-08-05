import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { SectionHeading } from "@/components/marketing/section-heading";
import { SectionShell } from "@/components/marketing/section-shell";
import { RevealOnView } from "@/components/marketing/reveal-on-view";
import {
  MarketingBackLink,
  MarketingShell,
} from "@/components/marketing/marketing-shell";
import {
  marketingGridGap,
  marketingMain,
  marketingSectionBody,
} from "@/lib/marketing-layout";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("supportPage");
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function SupportPage() {
  const t = await getTranslations("supportPage");

  const channels = [
    {
      title: t("channel1Title"),
      body: t("channel1Body"),
      href: "mailto:hello@anchor.care",
      label: t("channel1Cta"),
    },
    {
      title: t("channel2Title"),
      body: t("channel2Body"),
      href: "/for-parents#faq",
      label: t("channel2Cta"),
    },
    {
      title: t("channel3Title"),
      body: t("channel3Body"),
      href: "/for-programs#faq",
      label: t("channel3Cta"),
    },
  ];

  return (
    <MarketingShell>
      <main id="main-content" className={marketingMain}>
        <SectionShell tone="default" labelledBy="support-heading">
          <MarketingBackLink href="/">{t("backHome")}</MarketingBackLink>
          <RevealOnView className="mt-6">
            <SectionHeading
              id="support-heading"
              title={t("heroTitle")}
              subtitle={t("heroSubtitle")}
            />
          </RevealOnView>

          <div
            className={`${marketingSectionBody} grid ${marketingGridGap} md:grid-cols-3`}
          >
            {channels.map((channel, index) => (
              <RevealOnView key={channel.title} delayMs={index * 70}>
                <article className="flex h-full flex-col justify-between rounded-[1.25rem] bg-card p-6 ring-1 ring-border/50">
                  <div className="space-y-3">
                    <h2 className="font-display text-xl text-foreground">
                      {channel.title}
                    </h2>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {channel.body}
                    </p>
                  </div>
                  <Link
                    href={channel.href}
                    className="mt-6 inline-flex min-h-11 items-center text-sm font-medium text-primary transition-colors duration-300 ease-premium hover:text-primary/80"
                  >
                    {channel.label} →
                  </Link>
                </article>
              </RevealOnView>
            ))}
          </div>
        </SectionShell>

        <SectionShell tone="muted" labelledBy="safety-heading">
          <RevealOnView>
            <SectionHeading
              id="safety-heading"
              title={t("safetyTitle")}
              subtitle={t("safetySubtitle")}
            />
          </RevealOnView>
          <RevealOnView>
            <div className="mt-12 rounded-[1.25rem] border border-border/50 bg-card p-6 md:p-8">
              <p className="max-w-3xl leading-relaxed text-muted-foreground">
                {t("safetyBody")}
              </p>
              <Link
                href="mailto:hello@anchor.care?subject=ANCHOR%20safety%20concern"
                className="mt-6 inline-flex min-h-11 items-center text-sm font-medium text-primary transition-colors duration-300 ease-premium hover:text-primary/80"
              >
                {t("safetyCta")} →
              </Link>
            </div>
          </RevealOnView>
        </SectionShell>
      </main>
    </MarketingShell>
  );
}
