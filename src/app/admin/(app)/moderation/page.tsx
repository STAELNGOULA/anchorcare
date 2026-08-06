import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/business/page-header";
import { AdminModerationWorkspace } from "@/components/admin/platform/admin-moderation-workspace";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin.moderation");
  return { title: t("metaTitle") };
}

export default async function AdminModerationPage() {
  const t = await getTranslations("admin.moderation");

  return (
    <div className="space-y-8">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <AdminModerationWorkspace />
    </div>
  );
}
