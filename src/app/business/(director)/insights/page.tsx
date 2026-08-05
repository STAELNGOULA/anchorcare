import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { DashboardKpis } from "@/components/business/dashboard-kpis";
import { PageHeader } from "@/components/business/page-header";
import { getDirectorContext } from "@/lib/business/director-context";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("business.insights");
  return { title: t("metaTitle") };
}

export default async function BusinessInsightsPage() {
  const t = await getTranslations("business.insights");
  const context = await getDirectorContext();

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
        <DashboardKpis metrics={context.metrics} />
      </section>
    </div>
  );
}
