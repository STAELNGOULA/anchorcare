import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/business/page-header";
import { BezelCard } from "@/components/marketing/bezel-card";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("business.settings");
  return { title: t("metaTitle") };
}

export default async function BusinessSettingsPage() {
  const t = await getTranslations("business.settings");

  const sections = ["profile", "billing", "invites", "staff"] as const;

  return (
    <div className="space-y-8">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />

      <div className="grid gap-3 md:grid-cols-2">
        {sections.map((section) => (
          <BezelCard key={section} className="p-5 md:p-6">
            <div className="flex items-start justify-between gap-3">
              <p className="font-display text-lg text-foreground">
                {t(`sections.${section}.title`)}
              </p>
              <span className="shrink-0 rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                {t("comingSoon")}
              </span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              {t(`sections.${section}.body`)}
            </p>
          </BezelCard>
        ))}
      </div>
    </div>
  );
}
