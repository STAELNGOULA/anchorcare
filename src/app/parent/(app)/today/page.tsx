import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/business/page-header";
import { FamilyPlanBanner } from "@/components/parent/family-plan-banner";
import { ParentTodayWorkspace } from "@/components/parent/today/parent-today-workspace";
import { getParentContext } from "@/lib/parent/parent-context";
import { getParentTodayFeed } from "@/lib/parent/today-service";

type PageProps = {
  searchParams: Promise<{ childId?: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("parent.today");
  return { title: t("metaTitle") };
}

export default async function ParentTodayPage({ searchParams }: PageProps) {
  const t = await getTranslations("parent.today");
  const context = await getParentContext();
  const { childId: focusChildId } = await searchParams;

  const initialFeed = await getParentTodayFeed(
    context.userId,
    context.displayName,
  );

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
        <ParentTodayWorkspace
          context={context}
          initialFeed={initialFeed}
          focusChildId={focusChildId}
        />
      </section>
    </div>
  );
}
