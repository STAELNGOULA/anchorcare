"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { BezelCard } from "@/components/marketing/bezel-card";
import { Button } from "@/components/ui/button";
import { formatUsdCents } from "@/lib/money/format-usd";
import type { OrgRevenueStats } from "@/lib/business/revenue-service";

type InsightsRevenueProps = {
  initialStats: OrgRevenueStats;
};

export function InsightsRevenue({ initialStats }: InsightsRevenueProps) {
  const t = useTranslations("business.insights.revenue");
  const [stats, setStats] = useState(initialStats);
  const [days, setDays] = useState(initialStats.days);
  const [pending, setPending] = useState(false);

  const refresh = async (nextDays: number) => {
    setPending(true);
    try {
      const res = await fetch(
        `/api/business/revenue?days=${nextDays}`,
        { credentials: "include" },
      );
      const data = (await res.json()) as { ok?: boolean; stats?: OrgRevenueStats };
      if (res.ok && data.stats) setStats(data.stats);
    } finally {
      setPending(false);
    }
  };

  const exportCsv = () => {
    const header = "program,gross_usd,fees_usd,refunds_usd,net_usd";
    const rows = stats.byProgram.map((row) => {
      const net = row.grossCents - row.feeCents - row.refundCents;
      return [
        row.programName,
        (row.grossCents / 100).toFixed(2),
        (row.feeCents / 100).toFixed(2),
        (row.refundCents / 100).toFixed(2),
        (net / 100).toFixed(2),
      ].join(",");
    });
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `anchor-revenue-${days}d.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-full bg-secondary p-1">
          {[30, 7].map((d) => (
            <button
              key={d}
              type="button"
              disabled={pending}
              onClick={() => {
                setDays(d);
                void refresh(d);
              }}
              className={
                days === d
                  ? "rounded-full bg-background px-4 py-1.5 text-sm font-medium shadow-sm"
                  : "rounded-full px-4 py-1.5 text-sm text-muted-foreground"
              }
            >
              {t(`range.${d}d`)}
            </button>
          ))}
        </div>
        <Button type="button" variant="secondary" className="rounded-full" onClick={exportCsv}>
          {t("exportCsv")}
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <BezelCard className="p-5">
          <p className="text-sm text-muted-foreground">{t("gross")}</p>
          <p className="mt-2 font-display text-2xl">{formatUsdCents(stats.grossCents)}</p>
        </BezelCard>
        <BezelCard className="p-5">
          <p className="text-sm text-muted-foreground">{t("fees")}</p>
          <p className="mt-2 font-display text-2xl">{formatUsdCents(stats.platformFeeCents)}</p>
        </BezelCard>
        <BezelCard className="p-5">
          <p className="text-sm text-muted-foreground">{t("net")}</p>
          <p className="mt-2 font-display text-2xl text-primary">
            {formatUsdCents(stats.netCents)}
          </p>
        </BezelCard>
      </div>

      {stats.byProgram.length > 0 ? (
        <BezelCard className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-left text-muted-foreground">
              <tr>
                <th className="px-4 py-3">{t("program")}</th>
                <th className="px-4 py-3">{t("gross")}</th>
                <th className="px-4 py-3">{t("net")}</th>
              </tr>
            </thead>
            <tbody>
              {stats.byProgram
                .filter((r) => r.grossCents > 0)
                .slice(0, 10)
                .map((row) => (
                  <tr key={row.programId} className="border-t border-border/60">
                    <td className="px-4 py-3">{row.programName}</td>
                    <td className="px-4 py-3">{formatUsdCents(row.grossCents)}</td>
                    <td className="px-4 py-3">
                      {formatUsdCents(row.grossCents - row.feeCents - row.refundCents)}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </BezelCard>
      ) : (
        <p className="text-sm text-muted-foreground">{t("empty")}</p>
      )}
    </div>
  );
}
