import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/business/page-header";
import { HubSectionGrid } from "@/components/shared/hub-section-grid";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("parent.you");
  return { title: t("metaTitle") };
}

const YOU_SECTIONS = [
  { key: "subscription", href: "/parent/you/subscription" },
  { key: "consents", href: "/parent/you/consents" },
  { key: "forms", href: "/parent/you/forms", badge: "p15" as const },
  { key: "marketplace", href: "/parent/you/marketplace", badge: "p2" as const },
] as const;

export default async function ParentYouPage() {
  const t = await getTranslations("parent.you");

  return (
    <div className="space-y-8">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <HubSectionGrid namespace="parent.you" sections={YOU_SECTIONS} />
    </div>
  );
}
