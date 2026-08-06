import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ActivationFunnel } from "@/components/business/activation-funnel";
import { DashboardKpis } from "@/components/business/dashboard-kpis";
import { InsightsRevenue } from "@/components/business/insights-revenue";
import { InsightsTrends } from "@/components/business/insights-trends";
import { getOrgRevenueStats } from "@/lib/business/revenue-service";
import { PageHeader } from "@/components/business/page-header";
import { getDirectorContext } from "@/lib/business/director-context";
import { createClient } from "@/lib/supabase/server";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("business.insights");
  return { title: t("metaTitle") };
}

export default async function BusinessInsightsPage() {
  const t = await getTranslations("business.insights");
  const context = await getDirectorContext();

  let programs: { id: string; name: string }[] = [];
  let revenueStats = null;
  if (context.orgId) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("programs")
      .select("id, name")
      .eq("org_id", context.orgId)
      .order("name");
    programs = data ?? [];
    revenueStats = await getOrgRevenueStats(context.orgId, 30);
  }

  return (
    <div className="space-y-8 md:space-y-10">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />

      <section aria-labelledby="insights-kpis-heading" className="space-y-4">
        <h2
          id="insights-kpis-heading"
          className="font-display text-xl text-foreground md:text-2xl"
        >
          {t("kpiSectionTitle")}
        </h2>
        <DashboardKpis metrics={context.kpis} />
      </section>

      <ActivationFunnel
        invited={context.funnel.invited}
        registered={context.funnel.registered}
        appOpened={context.funnel.appOpened}
        reportRead={context.funnel.reportRead}
      />

      <section aria-labelledby="insights-revenue-heading" className="space-y-4">
        <h2
          id="insights-revenue-heading"
          className="font-display text-xl text-foreground md:text-2xl"
        >
          {t("revenueSectionTitle")}
        </h2>
        {revenueStats ? <InsightsRevenue initialStats={revenueStats} /> : null}
      </section>

      <section aria-labelledby="insights-trends-heading" className="space-y-4">
        <h2
          id="insights-trends-heading"
          className="font-display text-xl text-foreground md:text-2xl"
        >
          {t("trendsTitle")}
        </h2>
        <InsightsTrends stats={context.stats} programs={programs} />
      </section>
    </div>
  );
}
