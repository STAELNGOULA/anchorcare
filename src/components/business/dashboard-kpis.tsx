"use client";

import { useTranslations } from "next-intl";
import { BezelCard } from "@/components/marketing/bezel-card";
import { KpiCountUp } from "@/components/business/kpi-count-up";
import type { DashboardKpiMetric } from "@/lib/business/director-context";

type DashboardKpisProps = {
  metrics: DashboardKpiMetric[];
};

export function DashboardKpis({ metrics }: DashboardKpisProps) {
  const t = useTranslations("business.dashboard");

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {metrics.map((item) => (
        <BezelCard key={item.key} className="p-5 md:p-6">
          <p className="text-sm font-medium text-muted-foreground">
            {t(`kpi.${item.key}.label`)}
          </p>
          <p className="mt-3 font-display text-3xl tracking-tight text-foreground md:text-4xl">
            {item.pending && item.value == null ? (
              item.display
            ) : item.value != null ? (
              <KpiCountUp value={item.value} suffix={item.suffix} />
            ) : (
              item.display
            )}
          </p>
          {item.pending && item.pendingNote ? (
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              {t(`kpi.${item.pendingNote}.pending`)}
            </p>
          ) : null}
          {item.key === "activation" && !item.pending ? (
            <p className="mt-2 text-xs text-muted-foreground">
              {t("kpi.activation.benchmark")}
            </p>
          ) : null}
        </BezelCard>
      ))}
    </div>
  );
}
