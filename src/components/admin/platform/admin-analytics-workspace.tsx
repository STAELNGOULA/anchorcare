"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ErrorState } from "@/components/shared/error-state";
import { SkeletonList } from "@/components/shared/skeleton-list";
import type { AdminAnalyticsSnapshot } from "@/lib/admin/platform-types";
import { cn } from "@/lib/utils";

const RANGES = [7, 30, 90] as const;

export function AdminAnalyticsWorkspace() {
  const t = useTranslations("admin.analytics");
  const [range, setRange] = useState<number>(30);
  const [analytics, setAnalytics] = useState<AdminAnalyticsSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`/api/admin/analytics?range=${range}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("load_failed");
      const data = await res.json();
      setAnalytics(data.analytics);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    void load();
  }, [load]);

  const exportCsv = () => {
    if (!analytics) return;
    const rows = [
      ["metric", "value"],
      ["new_parents", String(analytics.newParents)],
      ["new_businesses", String(analytics.newBusinesses)],
      ["consult_volume", String(analytics.consultVolume)],
      ["report_open_rate", String(analytics.reportOpenRatePercent ?? "")],
      ["family_conversions", String(analytics.familyConversions)],
      ["pro_conversions", String(analytics.proConversions)],
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `anchor-analytics-${range}d.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <SkeletonList count={3} />;
  if (error || !analytics) {
    return <ErrorState title={t("errorTitle")} onRetry={() => void load()} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          {RANGES.map((days) => (
            <button
              key={days}
              type="button"
              onClick={() => setRange(days)}
              className={cn(
                "min-h-10 rounded-full px-4 text-sm font-medium transition-colors duration-[220ms] ease-out",
                range === days
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground",
              )}
            >
              {t("rangeDays", { days })}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={exportCsv}
          className="min-h-10 rounded-full bg-secondary px-4 text-sm font-medium text-foreground"
        >
          {t("exportCsv")}
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {(
          [
            ["newParents", analytics.newParents],
            ["newBusinesses", analytics.newBusinesses],
            ["consultVolume", analytics.consultVolume],
            ["reportOpenRate", analytics.reportOpenRatePercent ?? "—"],
            ["familyConversions", analytics.familyConversions],
            ["proConversions", analytics.proConversions],
          ] as const
        ).map(([key, value]) => (
          <div
            key={key}
            className="rounded-[1.25rem] bg-card p-6 ring-1 ring-border/50"
          >
            <p className="text-sm text-muted-foreground">{t(`metrics.${key}`)}</p>
            <p className="mt-2 font-display text-3xl text-foreground">
              {typeof value === "number" && key === "reportOpenRate"
                ? `${value}%`
                : value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <TrendPanel
          title={t("trends.activations")}
          rows={analytics.dailyActivations}
        />
        <TrendPanel title={t("trends.consults")} rows={analytics.dailyConsults} />
      </div>
    </div>
  );
}

function TrendPanel({
  title,
  rows,
}: {
  title: string;
  rows: { date: string; count: number }[];
}) {
  const max = Math.max(...rows.map((r) => r.count), 1);

  return (
    <div className="rounded-[1.25rem] bg-card p-6 ring-1 ring-border/50">
      <h3 className="font-display text-lg text-foreground">{title}</h3>
      {rows.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">—</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {rows.slice(-10).map((row) => (
            <li key={row.date} className="flex items-center gap-3 text-sm">
              <span className="w-24 shrink-0 text-muted-foreground">{row.date}</span>
              <div className="h-2 flex-1 rounded-full bg-secondary">
                <div
                  className="h-2 rounded-full bg-primary transition-[width] duration-[220ms] ease-out"
                  style={{ width: `${(row.count / max) * 100}%` }}
                />
              </div>
              <span className="w-8 text-right font-medium">{row.count}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
