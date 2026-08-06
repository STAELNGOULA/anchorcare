import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AnchorLogo } from "@/components/brand/anchor-logo";
import { BusinessOnboardingWizard } from "@/components/business/onboarding/business-onboarding-wizard";
import { OnboardingBenchmarkCard } from "@/components/business/onboarding/onboarding-benchmark-card";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { getOnboardingPageContext } from "@/lib/business/onboarding-access";
import { marketingContainer } from "@/lib/marketing-layout";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("business.onboarding");
  return { title: t("metaTitle") };
}

export default async function BusinessOnboardingPage() {
  const t = await getTranslations("business.onboarding");
  const context = await getOnboardingPageContext();

  return (
    <div className="relative min-h-[100dvh] bg-background py-10 md:py-14">
      <div className="absolute right-4 top-4 z-20 sm:right-6 sm:top-6">
        <ThemeToggle variant="pill" />
      </div>
      <div className="grain-overlay pointer-events-none fixed inset-0 z-0" aria-hidden />
      <div className={`${marketingContainer} relative z-10`}>
        <div className="mx-auto grid w-full max-w-5xl gap-8 lg:grid-cols-[1fr_320px] lg:gap-12">
          <div>
            <div className="mb-8 flex flex-col items-start gap-4">
              <AnchorLogo />
              <div className="space-y-2">
                <h1 className="font-display text-3xl leading-tight tracking-tight text-foreground md:text-4xl">
                  {t("title")}
                </h1>
                <p className="max-w-xl text-base leading-relaxed text-muted-foreground">
                  {t("subtitle")}
                </p>
              </div>
            </div>

            <div className="rounded-[1.25rem] bg-card p-6 ring-1 ring-border/50 shadow-soft md:p-8">
              <BusinessOnboardingWizard directorName={context.directorName} />
            </div>
          </div>

          <aside className="hidden lg:block">
            <div className="sticky top-8 space-y-4">
              <OnboardingBenchmarkCard />
              <p className="text-xs leading-relaxed text-muted-foreground">
                {t("sidebarNote")}
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
