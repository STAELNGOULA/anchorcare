import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound, redirect } from "next/navigation";
import { IncidentDetailWorkspace } from "@/components/incidents/incident-detail-workspace";
import { PageHeader } from "@/components/business/page-header";
import { getIncidentDetail } from "@/lib/incidents/incident-detail-service";
import { getDirectorOrgId } from "@/lib/registrations/registration-service";
import { createClient } from "@/lib/supabase/server";

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const t = await getTranslations("incidents.detail");
  return { title: `${t("metaTitle")} · ${id.slice(0, 8)}` };
}

export default async function BusinessIncidentDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?redirect=/business/reports/${id}`);

  const orgId = await getDirectorOrgId(user.id);
  if (!orgId) redirect("/business/onboarding");

  const detail = await getIncidentDetail(user.id, id);
  if ("error" in detail) notFound();
  if (detail.orgId !== orgId || detail.role !== "director") notFound();

  const t = await getTranslations("incidents.detail");

  return (
    <div className="space-y-8">
      <PageHeader title={t("businessTitle")} subtitle={t("businessSubtitle")} />
      <IncidentDetailWorkspace detail={detail} backHref="/business/reports" />
    </div>
  );
}
