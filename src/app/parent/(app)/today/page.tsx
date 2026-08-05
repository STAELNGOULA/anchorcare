import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/business/page-header";
import { FamilyPlanBanner } from "@/components/parent/family-plan-banner";
import { TodayEmpty } from "@/components/parent/today-empty";
import { getParentContext } from "@/lib/parent/parent-context";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("parent.today");
  return { title: t("metaTitle") };
}

export default async function ParentTodayPage() {
  const t = await getTranslations("parent.today");
  const context = await getParentContext();

  return (
    <div className="space-y-8 md:space-y-10">
      <PageHeader
        title={t("title", { name: context.displayName })}
        subtitle={t("subtitle")}
      />

      <FamilyPlanBanner context={context} />

      <section aria-labelledby="today-updates-heading" className="space-y-4">
        <h2
          id="today-updates-heading"
          className="font-display text-xl text-foreground md:text-2xl"
        >
          {t("updatesSectionTitle")}
        </h2>
        <TodayEmpty context={context} />
      </section>
    </div>
  );
}
