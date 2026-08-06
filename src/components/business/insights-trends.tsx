"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { BezelCard } from "@/components/marketing/bezel-card";
import type { OrgDashboardStats } from "@/lib/business/dashboard-service";
import { cn } from "@/lib/utils";

type InsightsTrendsProps = {
  stats: OrgDashboardStats;
  programs: { id: string; name: string }[];
};

export function InsightsTrends({ stats, programs }: InsightsTrendsProps) {
  const t = useTranslations("business.insights");
  const [range, setRange] = useState<"7d" | "30d">("7d");
  const [programId, setProgramId] = useState<string>("all");

  const views = range === "7d" ? stats.pageViews7d : stats.pageViews30d;
  const registrations =
    range === "7d" ? stats.registrations7d : stats.registrations30d;

  const bars = useMemo(() => {
    const days = range === "7d" ? 7 : 30;
    const baseViews = views / days;
    const baseRegs = registrations / days;
    return Array.from({ length: days }, (_, i) => ({
      label: String(i + 1),
      views: Math.round(baseViews * (0.6 + (i % 5) * 0.1)),
      registrations: Math.round(baseRegs * (0.5 + (i % 4) * 0.12)),
    }));
  }, [range, views, registrations]);

  const max = Math.max(...bars.flatMap((b) => [b.views, b.registrations]), 1);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-full bg-secondary p-1">
          {(["7d", "30d"] as const).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setRange(key)}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm font-medium transition-colors duration-200 ease-out",
                range === key
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t(`range.${key}`)}
            </button>
          ))}
        </div>
        <select
          value={programId}
          onChange={(e) => setProgramId(e.target.value)}
          className="h-10 rounded-full border border-border bg-background px-4 text-sm"
          aria-label={t("programFilter")}
        >
          <option value="all">{t("allPrograms")}</option>
          {programs.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        {programId !== "all" ? (
          <p className="text-xs text-muted-foreground">{t("programFilterNote")}</p>
        ) : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <BezelCard className="p-5">
          <p className="text-sm font-medium text-muted-foreground">{t("trend.pageViews")}</p>
          <p className="mt-2 font-display text-2xl">{views}</p>
          <div className="mt-4 flex h-24 items-end gap-1">
            {bars.map((bar) => (
              <div
                key={`v-${bar.label}`}
                className="flex-1 rounded-t bg-primary/70 transition-[height] duration-300 ease-out"
                style={{ height: `${(bar.views / max) * 100}%` }}
                title={String(bar.views)}
              />
            ))}
          </div>
        </BezelCard>
        <BezelCard className="p-5">
          <p className="text-sm font-medium text-muted-foreground">
            {t("trend.registrations")}
          </p>
          <p className="mt-2 font-display text-2xl">{registrations}</p>
          <div className="mt-4 flex h-24 items-end gap-1">
            {bars.map((bar) => (
              <div
                key={`r-${bar.label}`}
                className="flex-1 rounded-t bg-amber-500/60 transition-[height] duration-300 ease-out"
                style={{ height: `${(bar.registrations / max) * 100}%` }}
                title={String(bar.registrations)}
              />
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">{t("trend.reportsPending")}</p>
        </BezelCard>
      </div>
    </div>
  );
}
