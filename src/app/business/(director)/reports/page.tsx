import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/business/page-header";
import { SectionEmptyFromKey } from "@/components/business/section-empty";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("business.reports");
  return { title: t("metaTitle") };
}

export default async function BusinessReportsPage() {
  const t = await getTranslations("business.reports");

  return (
    <div className="space-y-8">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <SectionEmptyFromKey namespace="reports" />
    </div>
  );
}
