import { getTranslations } from "next-intl/server";
import { BezelCard } from "@/components/marketing/bezel-card";

export async function OnboardingBenchmarkCard() {
  const t = await getTranslations("business.onboarding");

  return (
    <BezelCard className="border-primary/15 bg-primary/5 p-5">
      <p className="text-sm font-medium text-foreground">{t("benchmarkTitle")}</p>
      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
        {t("benchmarkBody")}
      </p>
    </BezelCard>
  );
}
