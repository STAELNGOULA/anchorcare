import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { IncidentReportWizard } from "@/components/coach/incidents/incident-report-wizard";
import { PageHeader } from "@/components/business/page-header";
import { getIncidentFormContext } from "@/lib/incidents/incident-service";
import { getCoachContext } from "@/lib/coach/coach-context";

type PageProps = {
  searchParams: Promise<{ programId?: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("coach.incidents.form");
  return { title: t("metaTitle") };
}

export default async function CoachIncidentNewPage({ searchParams }: PageProps) {
  const { userId } = await getCoachContext();
  const { programId } = await searchParams;
  const t = await getTranslations("coach.incidents.form");

  const context = await getIncidentFormContext(userId, programId);
  if ("error" in context) {
    redirect("/coach/incidents");
  }

  return (
    <div className="space-y-8">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <IncidentReportWizard
        initialContext={context}
        initialProgramId={programId}
      />
    </div>
  );
}
