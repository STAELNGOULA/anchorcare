"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, Download } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ProgramListItem } from "@/lib/business/program-types";
import type { IncidentListItem } from "@/lib/incidents/incident-types";
import { cn } from "@/lib/utils";

type BusinessIncidentsWorkspaceProps = {
  programs: ProgramListItem[];
  initialItems: IncidentListItem[];
  initialHasMore: boolean;
};

type SeverityFilter = "all" | "green" | "yellow" | "red";

function severityBadge(severity: string, isRed: boolean) {
  if (isRed || severity === "red") {
    return "bg-destructive/10 text-destructive";
  }
  if (severity === "yellow") {
    return "bg-amber-500/10 text-amber-700 dark:text-amber-400";
  }
  return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400";
}

export function BusinessIncidentsWorkspace({
  programs,
  initialItems,
  initialHasMore,
}: BusinessIncidentsWorkspaceProps) {
  const t = useTranslations("business.reports");
  const [items, setItems] = useState(initialItems);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [severity, setSeverity] = useState<SeverityFilter>("all");
  const [programId, setProgramId] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const fetchList = useCallback(
    async (pageNum: number, append: boolean) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ page: String(pageNum) });
        if (severity !== "all") params.set("severity", severity);
        if (programId) params.set("programId", programId);
        if (fromDate) params.set("fromDate", fromDate);
        if (toDate) params.set("toDate", toDate);

        const res = await fetch(`/api/business/incidents?${params}`, {
          credentials: "include",
        });
        const data = (await res.json()) as {
          ok?: boolean;
          items?: IncidentListItem[];
          hasMore?: boolean;
        };
        if (data.ok && data.items) {
          setItems((prev) => (append ? [...prev, ...data.items!] : data.items!));
          setHasMore(data.hasMore ?? false);
          setPage(pageNum);
        }
      } finally {
        setLoading(false);
      }
    },
    [severity, programId, fromDate, toDate],
  );

  useEffect(() => {
    void fetchList(1, false);
  }, [fetchList]);

  const severityFilters: SeverityFilter[] = ["all", "red", "yellow", "green"];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-wrap gap-2 rounded-full bg-secondary/60 p-1">
          {severityFilters.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setSeverity(key)}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-medium transition-[background-color,color] duration-[220ms] ease-out",
                severity === key
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t(`filters.severity.${key}`)}
            </button>
          ))}
        </div>
        <button
          type="button"
          disabled
          title={t("exportDisabledHint")}
          className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm text-muted-foreground opacity-50"
        >
          <Download className="size-4" />
          {t("exportPdf")}
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <label className="space-y-1 text-sm">
          <span className="font-medium text-foreground">{t("filters.program")}</span>
          <select
            value={programId}
            onChange={(e) => setProgramId(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2"
          >
            <option value="">{t("filters.allPrograms")}</option>
            {programs.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1 text-sm">
          <span className="font-medium text-foreground">{t("filters.from")}</span>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2"
          />
        </label>
        <label className="space-y-1 text-sm">
          <span className="font-medium text-foreground">{t("filters.to")}</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2"
          />
        </label>
      </div>

      {loading && items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("loading")}</p>
      ) : items.length === 0 ? (
        <div className="rounded-[1.25rem] bg-card p-8 ring-1 ring-border/50">
          <h2 className="font-display text-xl text-foreground">{t("emptyTitle")}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{t("emptyBody")}</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                href={`/business/reports/${item.id}`}
                className={cn(
                  "block rounded-[1rem] bg-card px-4 py-4 ring-1 ring-border/50 transition-[box-shadow,transform] duration-[220ms] ease-out hover:-translate-y-0.5",
                  item.isRedFlag && "ring-destructive/20",
                )}
              >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-xs font-medium",
                        severityBadge(item.severity, item.isRedFlag),
                      )}
                    >
                      {item.isRedFlag && (
                        <AlertTriangle className="mr-1 inline size-3" aria-hidden />
                      )}
                      {t(`filters.severity.${item.severity}`)}
                    </span>
                    <span className="text-xs text-muted-foreground">{item.programName}</span>
                  </div>
                  <p className="font-medium text-foreground">
                    {item.childFirstName} {item.childLastName}
                  </p>
                  <p className="text-sm capitalize text-muted-foreground">
                    {item.incidentType.replace(/_/g, " ")} ·{" "}
                    {new Date(item.occurredAt).toLocaleString()}
                  </p>
                </div>
                <div className="text-right text-xs">
                  {item.parentNotifiedAt ? (
                    <span className="text-emerald-600 dark:text-emerald-400">
                      {t("parentNotified")}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">{t("notifyPending")}</span>
                  )}
                </div>
              </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {hasMore && (
        <button
          type="button"
          disabled={loading}
          onClick={() => void fetchList(page + 1, true)}
          className="w-full rounded-lg py-2.5 text-sm font-medium text-primary disabled:opacity-50"
        >
          {loading ? t("loading") : t("loadMore")}
        </button>
      )}
    </div>
  );
}
