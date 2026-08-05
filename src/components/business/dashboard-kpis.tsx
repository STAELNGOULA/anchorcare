import { getTranslations } from "next-intl/server";
import { BezelCard } from "@/components/marketing/bezel-card";
import type { DirectorContext } from "@/lib/business/director-context";

type DashboardKpisProps = {
  metrics: DirectorContext["metrics"];
};

export async function DashboardKpis({ metrics }: DashboardKpisProps) {
  const t = await getTranslations("business.dashboard");

  const items = [
    { key: "familiesActivated" as const, ...metrics.familiesActivated },
    { key: "reportsThisWeek" as const, ...metrics.reportsThisWeek },
    { key: "openRate" as const, ...metrics.openRate },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {items.map((item) => (
        <BezelCard key={item.key} className="p-5 md:p-6">
          <p className="text-sm font-medium text-muted-foreground">
            {t(`kpi.${item.key}.label`)}
          </p>
          <p className="mt-3 font-display text-3xl tracking-tight text-foreground md:text-4xl">
            {item.value}
          </p>
          {item.pending ? (
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              {t(`kpi.${item.key}.pending`)}
            </p>
          ) : null}
        </BezelCard>
      ))}
    </div>
  );
}
