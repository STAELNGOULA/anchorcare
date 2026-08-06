import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/business/page-header";
import { SettingsHub } from "@/components/settings/settings-hub";
import { TrialBanner } from "@/components/business/trial-banner";
import { getDirectorContext } from "@/lib/business/director-context";
import {
  BUSINESS_SETTINGS_GROUPS,
  getBusinessSettingsHubHints,
} from "@/lib/settings/business-settings-hub";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("business.settings");
  return { title: t("metaTitle") };
}

export default async function BusinessSettingsPage() {
  const context = await getDirectorContext();
  const hints = await getBusinessSettingsHubHints(context.userId);
  const t = await getTranslations("business.settings");

  return (
    <div className="space-y-8">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <TrialBanner context={context} />
      <SettingsHub
        namespace="business.settings"
        groups={BUSINESS_SETTINGS_GROUPS}
        hints={hints}
      />
    </div>
  );
}
