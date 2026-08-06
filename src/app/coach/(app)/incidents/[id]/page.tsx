import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { IncidentDetailWorkspace } from "@/components/incidents/incident-detail-workspace";
import { PageHeader } from "@/components/business/page-header";
import { getCoachContext } from "@/lib/coach/coach-context";
import { getIncidentDetail } from "@/lib/incidents/incident-detail-service";

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("incidents.detail");
  return { title: t("coachMetaTitle") };
}

export default async function CoachIncidentDetailPage({ params }: PageProps) {
  const { id } = await params;
  const { userId } = await getCoachContext();
  const detail = await getIncidentDetail(userId, id);
  if ("error" in detail || detail.role !== "coach") notFound();

  const t = await getTranslations("incidents.detail");

  return (
    <div className="space-y-8">
      <PageHeader title={t("coachTitle")} subtitle={t("coachSubtitle")} />
      <IncidentDetailWorkspace detail={detail} backHref="/coach/incidents" />
    </div>
  );
}
