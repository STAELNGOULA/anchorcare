import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/business/page-header";
import { ReportMediaWorkspace } from "@/components/coach/report/report-media-workspace";
import { getCoachContext } from "@/lib/coach/coach-context";
import { listProgramsForCoach } from "@/lib/coach/program-service";
import { getMediaWorkspace } from "@/lib/reports/media-service";

type PageProps = {
  params: Promise<{ programId: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { programId } = await params;
  const t = await getTranslations("coach.report.media");
  const context = await getCoachContext();
  const programs = await listProgramsForCoach(context.userId);
  const program = programs.find((row) => row.id === programId);
  return {
    title: program ? `${t("metaTitle")} · ${program.name}` : t("metaTitle"),
  };
}

export default async function CoachReportMediaPage({ params }: PageProps) {
  const { programId } = await params;
  const t = await getTranslations("coach.report.media");
  const context = await getCoachContext();
  const programs = await listProgramsForCoach(context.userId);
  const program = programs.find((row) => row.id === programId);

  if (!program) {
    notFound();
  }

  const result = await getMediaWorkspace(context.userId, programId);
  if (!result.ok) {
    notFound();
  }

  return (
    <div className="space-y-8 md:space-y-10">
      <PageHeader title={t("title")} subtitle={t("pageSubtitle")} />
      <ReportMediaWorkspace
        program={program}
        programs={programs}
        initialWorkspace={result.workspace}
      />
    </div>
  );
}
