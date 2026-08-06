import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AdminConsultQueue } from "@/components/admin/consults/admin-consult-queue";
import { PageHeader } from "@/components/business/page-header";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin.consults");
  return { title: t("metaTitle") };
}

export default async function AdminConsultsPage() {
  const t = await getTranslations("admin.consults");

  return (
    <div className="space-y-8">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <AdminConsultQueue />
    </div>
  );
}
