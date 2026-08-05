import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/business/page-header";
import { HubSectionGrid } from "@/components/shared/hub-section-grid";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("business.settings");
  return { title: t("metaTitle") };
}

const SETTINGS_SECTIONS = [
  { key: "profile", href: "/business/settings/profile" },
  { key: "billing", href: "/business/settings/billing" },
  { key: "invites", href: "/business/settings/invites" },
  { key: "staff", href: "/business/settings/staff" },
  { key: "analytics", href: "/business/insights" },
  { key: "digest", href: "/business/settings/digest", badge: "p15" as const },
  { key: "marketplace", href: "/business/settings/marketplace", badge: "p2" as const },
  { key: "compliance", href: "/business/settings/compliance", badge: "p2" as const },
] as const;

export default async function BusinessSettingsPage() {
  const t = await getTranslations("business.settings");

  return (
    <div className="space-y-8">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <HubSectionGrid
        namespace="business.settings"
        sections={SETTINGS_SECTIONS}
      />
    </div>
  );
}
