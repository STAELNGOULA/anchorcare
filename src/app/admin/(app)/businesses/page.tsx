import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/business/page-header";
import { AdminBusinessesWorkspace } from "@/components/admin/platform/admin-businesses-workspace";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin.businesses");
  return { title: t("metaTitle") };
}

export default async function AdminBusinessesPage() {
  const t = await getTranslations("admin.businesses");

  return (
    <div className="space-y-8">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <AdminBusinessesWorkspace />
    </div>
  );
}
