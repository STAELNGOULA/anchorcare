import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/business/page-header";
import { SectionEmpty } from "@/components/coach/section-empty";
import { getCoachContext } from "@/lib/coach/coach-context";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("coach.programs");
  return { title: t("metaTitle") };
}

export default async function CoachProgramsPage() {
  const t = await getTranslations("coach.programs");
  const context = await getCoachContext();

  return (
    <div className="space-y-8 md:space-y-10">
      <PageHeader
        title={t("title", { name: context.displayName })}
        subtitle={t("subtitle")}
      />
      <SectionEmpty
        title={t("emptyTitle")}
        body={t("emptyBody")}
      />
    </div>
  );
}
