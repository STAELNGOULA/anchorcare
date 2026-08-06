import type { Metadata } from "next";

import { getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/business/page-header";

import { ReportProgramHub } from "@/components/coach/report/report-program-hub";

import { getCoachContext } from "@/lib/coach/coach-context";

import { listProgramsForCoach } from "@/lib/coach/program-service";

import { redirect } from "next/navigation";



export async function generateMetadata(): Promise<Metadata> {

  const t = await getTranslations("coach.report");

  return { title: t("metaTitle") };

}



export default async function CoachReportPage() {

  const t = await getTranslations("coach.report");

  const context = await getCoachContext();

  const programs =

    context.role === "coach" ? await listProgramsForCoach(context.userId) : [];



  if (programs.length === 1) {

    redirect(`/coach/report/${programs[0]!.id}/voice`);

  }



  return (

    <div className="space-y-8">

      <PageHeader title={t("title")} subtitle={t("subtitle")} />

      <ReportProgramHub programs={programs} />

    </div>

  );

}

