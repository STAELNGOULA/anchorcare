import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/business/page-header";
import { ReviewReportWorkspace } from "@/components/coach/report/review-report-workspace";
import { getCoachContext } from "@/lib/coach/coach-context";
import { listProgramsForCoach } from "@/lib/coach/program-service";
import { getReviewWorkspace } from "@/lib/reports/review-report-service";

type PageProps = {
  params: Promise<{ programId: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { programId } = await params;
  const t = await getTranslations("coach.report.review");
  const context = await getCoachContext();
  const programs = await listProgramsForCoach(context.userId);
  const program = programs.find((row) => row.id === programId);
  return {
    title: program ? `${t("metaTitle")} · ${program.name}` : t("metaTitle"),
  };
}

export default async function CoachReviewReportPage({ params }: PageProps) {
  const { programId } = await params;
  const t = await getTranslations("coach.report.review");
  const context = await getCoachContext();
  const programs = await listProgramsForCoach(context.userId);
  const program = programs.find((row) => row.id === programId);

  if (!program) {
    notFound();
  }

  const result = await getReviewWorkspace(context.userId, programId);

  if (!result.ok) {
    if (result.error.includes("record voice")) {
      redirect(`/coach/report/${programId}/voice`);
    }
    redirect(`/coach/report/${programId}/voice`);
  }

  return (
    <div className="space-y-8 md:space-y-10">
      <PageHeader title={t("title")} subtitle={t("pageSubtitle")} />
      <ReviewReportWorkspace
        program={program}
        programs={programs}
        initialWorkspace={result.workspace}
      />
    </div>
  );
}
