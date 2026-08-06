import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { DashboardChecklist } from "@/components/business/dashboard-checklist";
import { DashboardKpis } from "@/components/business/dashboard-kpis";
import { DashboardHandoffStrip } from "@/components/business/dashboard-handoff-strip";
import { DashboardQuickActions } from "@/components/business/dashboard-quick-actions";
import { DashboardTodayStrip } from "@/components/business/dashboard-today-strip";
import { PageHeader } from "@/components/business/page-header";
import { TrialBanner } from "@/components/business/trial-banner";
import { TrialEndingModal } from "@/components/business/trial-ending-modal";
import { getDirectorContext } from "@/lib/business/director-context";

export const revalidate = 300;

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

      <TrialEndingModal
        open={context.showTrialEndingModal}
        trialDaysLeft={context.trialDaysLeft}
      />

      <DashboardChecklist
        items={context.checklist}
        complete={context.checklistComplete}
        publicPageUrl={context.publicPageUrl}
      />

      <section aria-labelledby="dashboard-kpis-heading" className="space-y-4">
        <h2
          id="dashboard-kpis-heading"
          className="font-display text-xl text-foreground md:text-2xl"
        >
          {t("kpiSectionTitle")}
        </h2>
        <DashboardKpis metrics={context.kpis} />
      </section>

      <DashboardTodayStrip today={context.today} />

      <DashboardHandoffStrip notes={context.today.handoffNotes} />

      <section aria-labelledby="dashboard-actions-heading" className="space-y-4">
        <h2
          id="dashboard-actions-heading"
          className="font-display text-xl text-foreground md:text-2xl"
        >
          {t("actionsSectionTitle")}
        </h2>
        <DashboardQuickActions
          actions={context.actions}
          publicPageUrl={context.publicPageUrl}
        />
      </section>
    </div>
  );
}
