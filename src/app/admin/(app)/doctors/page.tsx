import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/business/page-header";
import { AdminSectionEmptyFromKey } from "@/components/admin/section-empty";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin.doctors");
  return { title: t("metaTitle") };
}

export default async function AdminDoctorsPage() {
  const t = await getTranslations("admin.doctors");

  return (
    <div className="space-y-8">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <AdminSectionEmptyFromKey namespace="doctors" />
    </div>
  );
}
