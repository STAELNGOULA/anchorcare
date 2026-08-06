"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ErrorState } from "@/components/shared/error-state";
import { SkeletonList } from "@/components/shared/skeleton-list";
import type { ConsultListItem } from "@/lib/consults/consult-types";
import { cn } from "@/lib/utils";

const STATUS_ORDER = ["pending", "assigned", "open", "closed"] as const;

export function AdminConsultQueue() {
  const t = useTranslations("admin.consults");
  const [consults, setConsults] = useState<ConsultListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("active");

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      const res = await fetch(`/api/admin/consults?${params}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("load_failed");
      const data = await res.json();
      let items: ConsultListItem[] = data.consults ?? [];
      if (statusFilter === "active") {
        items = items.filter((c) => c.status !== "closed");
      } else if (statusFilter !== "all") {
        items = items.filter((c) => c.status === statusFilter);
      }
      setConsults(items);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const grouped = STATUS_ORDER.reduce(
    (acc, status) => {
      acc[status] = consults.filter((c) => c.status === status);
      return acc;
    },
    {} as Record<(typeof STATUS_ORDER)[number], ConsultListItem[]>,
  );

  if (loading) return <SkeletonList count={4} />;

  if (error) {
    return <ErrorState title={t("errorTitle")} onRetry={() => void load()} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {(["active", "pending", "assigned", "open", "closed", "all"] as const).map(
          (filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setStatusFilter(filter)}
              className={cn(
                "min-h-10 rounded-full px-4 text-sm font-medium transition-colors duration-[220ms] ease-out",
                statusFilter === filter
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground",
              )}
            >
              {t(`filters.${filter}`)}
            </button>
          ),
        )}
      </div>

      {consults.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">{t("empty")}</p>
      ) : statusFilter === "active" || statusFilter === "all" ? (
        <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-4">
          {STATUS_ORDER.map((status) => (
            <section key={status} className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t(`columns.${status}`)} ({grouped[status].length})
              </h2>
              <div className="space-y-2">
                {grouped[status].map((consult) => (
                  <ConsultQueueCard key={consult.id} consult={consult} />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {consults.map((consult) => (
            <ConsultQueueCard key={consult.id} consult={consult} />
          ))}
        </div>
      )}
    </div>
  );
}

function ConsultQueueCard({ consult }: { consult: ConsultListItem }) {
  const t = useTranslations("admin.consults");

  return (
    <Link
      href={`/admin/consults/${consult.id}`}
      className={cn(
        "block rounded-xl bg-card p-4 ring-1 ring-border/50",
        "transition-[transform,box-shadow] duration-[220ms] ease-out hover:-translate-y-0.5 hover:shadow-sm active:scale-[0.99]",
        consult.priority === "high" && "ring-destructive/30",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="font-medium text-foreground">
          {consult.childFirstName}
          {consult.programName ? ` · ${consult.programName}` : ""}
        </p>
        {consult.priority === "high" ? (
          <span className="shrink-0 rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-destructive">
            {t("priority.high")}
          </span>
        ) : null}
      </div>
      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
        {consult.initialMessagePreview}
      </p>
      <p className="mt-2 text-[10px] text-muted-foreground">
        {new Date(consult.createdAt).toLocaleString()}
      </p>
    </Link>
  );
}
