import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ConversionCta } from "@/components/marketing/conversion-cta";
import { FaqSection } from "@/components/marketing/faq-section";
import { FeatureGrid } from "@/components/marketing/feature-grid";
import { PageHero } from "@/components/marketing/page-hero";
import { PainPointsSection } from "@/components/marketing/pain-points-section";
import { ReferralSection } from "@/components/marketing/referral-section";
import { RetentionSection } from "@/components/marketing/retention-section";
import { PricingSection } from "@/components/marketing/pricing-section";
import { StepsSection } from "@/components/marketing/steps-section";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import {
  buildFaqItems,
  buildFeatures,
  buildPainPoints,
  buildProgramsPricingPlans,
  buildRetentionItems,
  buildSteps,
} from "@/lib/marketing-content";
import { marketingMain } from "@/lib/marketing-layout";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("programsPage");
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    openGraph: {
      title: t("metaTitle"),
      description: t("metaDescription"),
      type: "website",
    },
  };
}

export default async function ForProgramsPage() {
  const t = await getTranslations("programsPage");
  const pricing = await getTranslations("landing");

  return (
    <MarketingShell>
      <main id="main-content" className={marketingMain}>
        <PageHero
          title={t("heroTitle")}
          subtitle={t("heroSubtitle")}
          primaryCta={{ href: "/sign-up?intent=program", label: t("heroPrimaryCta") }}
          secondaryCta={{ href: "#how-it-works", label: t("heroSecondaryCta") }}
          signInCta={{
            href: "/login",
            prompt: t("heroSignInPrompt"),
            label: t("heroSignInLabel"),
          }}
        />

        <PainPointsSection
          title={t("painTitle")}
          subtitle={t("painSubtitle")}
          points={buildPainPoints(t, 3)}
          tone="muted"
        />

        <StepsSection
          id="how-it-works"
          title={t("stepsTitle")}
          subtitle={t("stepsSubtitle")}
          steps={buildSteps(t, 4)}
          tone="default"
        />

        <FeatureGrid
          title={t("featuresTitle")}
          subtitle={t("featuresSubtitle")}
          features={buildFeatures(t, 6)}
          tone="muted"
        />

        <RetentionSection
          title={t("retentionTitle")}
          subtitle={t("retentionSubtitle")}
          items={buildRetentionItems(t, 3)}
          cta={{ href: "/sign-up?intent=program", label: t("retentionCta") }}
          tone="default"
        />

        <PricingSection
          title={t("pricingTitle")}
          subtitle={t("pricingSubtitle")}
          plans={buildProgramsPricingPlans(pricing)}
          tone="soft"
        />

        <ConversionCta
          title={t("conversionTitle")}
          subtitle={t("conversionSubtitle")}
          primaryCta={{ href: "/sign-up?intent=program", label: t("conversionPrimaryCta") }}
          secondaryCta={{
            href: "mailto:hello@anchor.care?subject=ANCHOR%20program%20demo",
            label: t("conversionSecondaryCta"),
          }}
          tone="soft"
        />

        <ReferralSection
          title={t("referralTitle")}
          body={t("referralBody")}
          note={t("referralNote")}
          cta={{
            href: "mailto:hello@anchor.care?subject=ANCHOR%20program%20referral",
            label: t("referralCta"),
          }}
          tone="default"
        />

        <FaqSection
          title={t("faqTitle")}
          items={buildFaqItems(t, 5)}
          tone="muted"
        />

        <ConversionCta
          title={t("finalCtaTitle")}
          subtitle={t("finalCtaSubtitle")}
          primaryCta={{ href: "/sign-up?intent=program", label: t("finalCtaPrimary") }}
          secondaryCta={{ href: "/login", label: t("finalCtaSecondary") }}
          tone="default"
        />
      </main>
    </MarketingShell>
  );
}
