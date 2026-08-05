import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/business/page-header";
import { SurfacePlaceholder } from "@/components/shared/surface-placeholder";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin.marketplace");
  return { title: t("metaTitle") };
}

export default async function AdminMarketplacePage() {
  const t = await getTranslations("admin.marketplace");

  return (
    <div className="space-y-8">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <SurfacePlaceholder namespace="admin.marketplace" phase="p2" specId="§8.2" />
    </div>
  );
}
