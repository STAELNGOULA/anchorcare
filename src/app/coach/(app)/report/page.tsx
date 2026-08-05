import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/business/page-header";
import { CoachSectionEmptyFromKey } from "@/components/coach/section-empty";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("coach.report");
  return { title: t("metaTitle") };
}

export default async function CoachReportPage() {
  const t = await getTranslations("coach.report");

  return (
    <div className="space-y-8">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <CoachSectionEmptyFromKey namespace="report" ctaHref="/coach/programs" />
    </div>
  );
}
