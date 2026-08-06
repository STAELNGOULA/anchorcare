import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/business/page-header";
import { CoachProgramList } from "@/components/coach/coach-program-list";
import { getCoachContext } from "@/lib/coach/coach-context";
import { listProgramsForCoach } from "@/lib/coach/program-service";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("coach.programs");
  return { title: t("metaTitle") };
}

export default async function CoachProgramsPage() {
  const t = await getTranslations("coach.programs");
  const context = await getCoachContext();
  const programs =
    context.role === "coach" ? await listProgramsForCoach(context.userId) : [];

  return (
    <div className="space-y-8 md:space-y-10">
      <PageHeader
        title={t("title", { name: context.displayName })}
        subtitle={t("subtitle")}
      />
      <CoachProgramList programs={programs} />
    </div>
  );
}
