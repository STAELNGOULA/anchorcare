import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/business/page-header";
import { ParentSectionEmptyFromKey } from "@/components/parent/section-empty";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("parent.timeline");
  return { title: t("metaTitle") };
}

export default async function ParentTimelinePage() {
  const t = await getTranslations("parent.timeline");

  return (
    <div className="space-y-8">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <ParentSectionEmptyFromKey namespace="timeline" />
    </div>
  );
}
