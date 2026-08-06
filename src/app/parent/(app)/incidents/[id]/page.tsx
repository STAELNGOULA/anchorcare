import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { IncidentDetailWorkspace } from "@/components/incidents/incident-detail-workspace";
import { getIncidentDetail } from "@/lib/incidents/incident-detail-service";
import { getParentContext } from "@/lib/parent/parent-context";

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("incidents.detail");
  return { title: t("parentMetaTitle") };
}

export default async function ParentIncidentDetailPage({ params }: PageProps) {
  const { id } = await params;
  const { userId } = await getParentContext();

  const detail = await getIncidentDetail(userId, id);
  if ("error" in detail || detail.role !== "parent") notFound();

  return (
    <IncidentDetailWorkspace
      detail={detail}
      backHref={`/parent/timeline?childId=${detail.childId}&filter=incidents`}
    />
  );
}
