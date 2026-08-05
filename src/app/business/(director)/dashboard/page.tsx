import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { DashboardActions } from "@/components/business/dashboard-actions";
import { DashboardChecklist } from "@/components/business/dashboard-checklist";
import { PageHeader } from "@/components/business/page-header";
import { TrialBanner } from "@/components/business/trial-banner";
import { getDirectorContext } from "@/lib/business/director-context";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("business.dashboard");
  return { title: t("metaTitle") };
}

export default async function BusinessDashboardPage() {
  const t = await getTranslations("business.dashboard");
  const context = await getDirectorContext();

  return (
    <div className="space-y-8 md:space-y-10">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />

      <TrialBanner context={context} />

      <DashboardChecklist
        items={context.checklist}
        complete={context.checklistComplete}
      />

      <section aria-labelledby="dashboard-actions-heading" className="space-y-4">
        <h2
          id="dashboard-actions-heading"
          className="font-display text-xl text-foreground md:text-2xl"
        >
          {t("actionsSectionTitle")}
        </h2>
        <DashboardActions actions={context.actions} />
      </section>
    </div>
  );
}
