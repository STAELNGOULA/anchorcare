import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/business/page-header";
import { VoiceRecordWorkspace } from "@/components/coach/report/voice-record-workspace";
import { getCoachContext } from "@/lib/coach/coach-context";
import { listProgramsForCoach } from "@/lib/coach/program-service";
import { getTodayVoiceDraft } from "@/lib/reports/voice-report-service";

type PageProps = {
  params: Promise<{ programId: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { programId } = await params;
  const t = await getTranslations("coach.report.voice");
  const context = await getCoachContext();
  const programs = await listProgramsForCoach(context.userId);
  const program = programs.find((row) => row.id === programId);
  return {
    title: program ? `${t("metaTitle")} · ${program.name}` : t("metaTitle"),
  };
}

export default async function CoachVoiceRecordPage({ params }: PageProps) {
  const { programId } = await params;
  const t = await getTranslations("coach.report.voice");
  const context = await getCoachContext();
  const programs = await listProgramsForCoach(context.userId);
  const program = programs.find((row) => row.id === programId);

  if (!program) {
    notFound();
  }

  const draft = await getTodayVoiceDraft(programId);

  return (
    <div className="space-y-8 md:space-y-10">
      <PageHeader title={t("title")} subtitle={t("pageSubtitle")} />
      <VoiceRecordWorkspace
        program={program}
        programs={programs}
        initialDraft={draft}
      />
    </div>
  );
}
