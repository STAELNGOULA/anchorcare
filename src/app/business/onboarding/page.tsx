import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { completeProgramOnboarding } from "@/lib/auth/actions";
import { marketingContainer } from "@/lib/marketing-layout";
import { Button } from "@/components/ui/button";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth");
  return { title: t("onboardingProgramTitle") };
}

export default async function BusinessOnboardingPage() {
  const t = await getTranslations("auth");

  return (
    <div className="min-h-[100dvh] bg-background">
      <div className={`${marketingContainer} py-16 md:py-24`}>
        <div className="mx-auto max-w-2xl space-y-6 text-center">
          <h1 className="font-display text-4xl leading-tight text-foreground md:text-5xl">
            {t("onboardingProgramTitle")}
          </h1>
          <p className="text-lg leading-relaxed text-muted-foreground">
            {t("onboardingProgramSubtitle")}
          </p>
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <form action={completeProgramOnboarding}>
              <Button type="submit" className="rounded-full px-8">
                {t("onboardingProgramCta")}
              </Button>
            </form>
            <Link
              href="/support"
              className="inline-flex min-h-11 items-center justify-center rounded-full px-6 py-3 text-sm font-medium text-muted-foreground ring-1 ring-border/70 transition-colors duration-300 ease-premium hover:text-foreground"
            >
              {t("contactSupport")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
