import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/business/page-header";
import { CoachSectionEmptyFromKey } from "@/components/coach/section-empty";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("coach.incidents");
  return { title: t("metaTitle") };
}

export default async function CoachIncidentsPage() {
  const t = await getTranslations("coach.incidents");

  return (
    <div className="space-y-8">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <CoachSectionEmptyFromKey namespace="incidents" />
    </div>
  );
}
