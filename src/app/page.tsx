import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AudienceSplit } from "@/components/marketing/audience-split";
import { ConversionCta } from "@/components/marketing/conversion-cta";
import { FaqSection } from "@/components/marketing/faq-section";
import { HomeBento } from "@/components/marketing/home-bento";
import { HomeTrust } from "@/components/marketing/home-trust";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { PremiumCta } from "@/components/marketing/premium-cta";
import { ReferralSection } from "@/components/marketing/referral-section";
import { ReportPreview } from "@/components/marketing/report-preview";
import { RevealOnView } from "@/components/marketing/reveal-on-view";
import { PricingSection } from "@/components/marketing/pricing-section";
import { StepsSection } from "@/components/marketing/steps-section";
import { buildHomePricingPlans } from "@/lib/marketing-content";
import {
  marketingContainer,
  marketingHero,
  marketingMain,
} from "@/lib/marketing-layout";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("landing");

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

export default async function HomePage() {
  const t = await getTranslations("landing");

  const previewLabels = {
    previewDate: t("previewDate"),
    previewChild: t("previewChild"),
    previewHeadline: t("previewHeadline"),
    previewBody: t("previewBody"),
    previewVoice: t("previewVoice"),
    previewPhotos: t("previewPhotos"),
    previewPhotoAlt: t("previewPhotoAlt"),
  };

  const bentoLabels = {
    bentoSectionTitle: t("bentoSectionTitle"),
    bentoTimelineTitle: t("bentoTimelineTitle"),
    bentoTimelineBody: t("bentoTimelineBody"),
    bentoTimelineStep1: t("bentoTimelineStep1"),
    bentoTimelineStep2: t("bentoTimelineStep2"),
    bentoTimelineStep3: t("bentoTimelineStep3"),
    bentoVoiceTitle: t("bentoVoiceTitle"),
    bentoVoiceBody: t("bentoVoiceBody"),
    bentoSafetyTitle: t("bentoSafetyTitle"),
    bentoSafetyBody: t("bentoSafetyBody"),
    bentoProgramsTitle: t("bentoProgramsTitle"),
    bentoProgramsBody: t("bentoProgramsBody"),
    bentoProgramsHighlight: t("bentoProgramsHighlight"),
  };

  const homeSteps = [
    { title: t("homeStep1Title"), body: t("homeStep1Body") },
    { title: t("homeStep2Title"), body: t("homeStep2Body") },
    { title: t("homeStep3Title"), body: t("homeStep3Body") },
    { title: t("homeStep4Title"), body: t("homeStep4Body") },
  ];

  return (
    <MarketingShell>
      <main id="main-content" className={marketingMain}>
        <section
          className={`${marketingHero} ${marketingContainer}`}
          aria-labelledby="hero-heading"
        >
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">
            <RevealOnView className="space-y-7">
              <h1
                id="hero-heading"
                className="font-display text-balance text-4xl leading-[1.05] tracking-tight text-foreground md:text-5xl lg:text-6xl"
              >
                {t("heroTitle")}
              </h1>
              <p className="max-w-xl text-lg leading-relaxed text-muted-foreground">
                {t("heroSubtitle")}
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                <PremiumCta href="/sign-up?intent=program">{t("ctaBusiness")}</PremiumCta>
                <PremiumCta href="/sign-up?intent=parent" variant="secondary" showArrow={false}>
                  {t("ctaParentSignUp")}
                </PremiumCta>
              </div>
            </RevealOnView>

            <ReportPreview labels={previewLabels} />
          </div>
        </section>

        <AudienceSplit
          title={t("audienceTitle")}
          subtitle={t("audienceSubtitle")}
          parents={{
            title: t("audienceParentsTitle"),
            body: t("audienceParentsBody"),
            learnMoreHref: "/for-parents",
            learnMoreLabel: t("audienceLearnMore"),
          }}
          programs={{
            title: t("audienceProgramsTitle"),
            body: t("audienceProgramsBody"),
            learnMoreHref: "/for-programs",
            learnMoreLabel: t("audienceLearnMore"),
          }}
          tone="muted"
        />

        <StepsSection
          title={t("homeStepsTitle")}
          subtitle={t("homeStepsSubtitle")}
          steps={homeSteps}
          tone="default"
        />

        <HomeBento labels={bentoLabels} tone="muted" />

        <HomeTrust
          labels={{
            trustQuote: t("trustQuote"),
            trustAttribution: t("trustAttribution"),
          }}
          tone="default"
        />

        <PricingSection
          title={t("pricingTitle")}
          subtitle={t("pricingSubtitle")}
          plans={buildHomePricingPlans(t)}
          footnote={t("pricingFootnote")}
          tone="muted"
        />

        <FaqSection
          title={t("homeFaqTitle")}
          items={[
            { question: t("homeFaq1Q"), answer: t("homeFaq1A") },
            { question: t("homeFaq2Q"), answer: t("homeFaq2A") },
            { question: t("homeFaq3Q"), answer: t("homeFaq3A") },
            { question: t("homeFaq4Q"), answer: t("homeFaq4A") },
            { question: t("homeFaq5Q"), answer: t("homeFaq5A") },
          ]}
          tone="muted"
        />

        <ReferralSection
          title={t("homeReferralTitle")}
          body={t("homeReferralBody")}
          note={t("homeReferralNote")}
          cta={{
            href: "mailto:hello@anchor.care?subject=ANCHOR%20referral",
            label: t("homeReferralCta"),
          }}
          tone="default"
        />

        <ConversionCta
          title={t("ctaBandTitle")}
          subtitle={t("ctaBandSubtitle")}
          primaryCta={{ href: "/sign-up?intent=program", label: t("ctaBusiness") }}
          secondaryCta={{ href: "/sign-up?intent=parent", label: t("ctaParentSignUp") }}
          tone="soft"
        />
      </main>
    </MarketingShell>
  );
}
