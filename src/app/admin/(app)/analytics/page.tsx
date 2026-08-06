import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/business/page-header";
import { AdminAnalyticsWorkspace } from "@/components/admin/platform/admin-analytics-workspace";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin.analytics");
  return { title: t("metaTitle") };
}

export default async function AdminAnalyticsPage() {
  const t = await getTranslations("admin.analytics");

  return (
    <div className="space-y-8">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <AdminAnalyticsWorkspace />
    </div>
  );
}
