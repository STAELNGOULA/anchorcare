import { getTranslations } from "next-intl/server";
import { BezelCard } from "@/components/marketing/bezel-card";
import type { DirectorContext } from "@/lib/business/director-context";

type DashboardTodayStripProps = {
  today: Pick<DirectorContext["today"], "reportsPublished" | "pendingRegistrations">;
};

export async function DashboardTodayStrip({ today }: DashboardTodayStripProps) {
  const t = await getTranslations("business.dashboard");

  return (
    <section aria-labelledby="dashboard-today-heading" className="space-y-4">
      <h2
        id="dashboard-today-heading"
        className="font-display text-xl text-foreground md:text-2xl"
      >
        {t("todaySectionTitle")}
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <BezelCard className="p-5">
          <p className="text-sm text-muted-foreground">{t("today.reportsPublished")}</p>
          <p className="mt-2 font-display text-3xl text-foreground">
            {today.reportsPublished}
          </p>
          {today.reportsPublished === 0 ? (
            <p className="mt-2 text-xs text-muted-foreground">{t("today.reportsPending")}</p>
          ) : null}
        </BezelCard>
        <BezelCard className="p-5">
          <p className="text-sm text-muted-foreground">{t("today.pendingRegistrations")}</p>
          <p className="mt-2 font-display text-3xl text-foreground">
            {today.pendingRegistrations}
          </p>
        </BezelCard>
      </div>
    </section>
  );
}
