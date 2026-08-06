"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { FileText } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { SkeletonList } from "@/components/shared/skeleton-list";
import type { VisitReportListItem } from "@/lib/visits/visit-types";
import { cn } from "@/lib/utils";

function formatVisitDate(isoDate: string): string {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${isoDate}T12:00:00`));
}

export function VisitListClient() {
  const t = useTranslations("parent.care.visits");
  const [visits, setVisits] = useState<VisitReportListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch("/api/parent/visits", { credentials: "include" });
      if (!res.ok) throw new Error("load_failed");
      const data = await res.json();
      setVisits(data.visits ?? []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <SkeletonList count={4} />;

  if (error) {
    return <ErrorState title={t("errorTitle")} onRetry={() => void load()} />;
  }

  if (visits.length === 0) {
    return (
      <EmptyState
        title={t("emptyTitle")}
        description={t("emptyBody")}
        actionLabel={t("browseDoctors")}
        actionHref="/parent/care/doctors"
      />
    );
  }

  return (
    <div className="space-y-3">
      {visits.map((visit) => (
        <Link
          key={visit.id}
          href={`/parent/care/visits/${visit.id}`}
          className={cn(
            "flex items-start gap-4 rounded-[1.25rem] bg-card p-5 ring-1 ring-border/50",
            "transition-[transform,box-shadow] duration-[220ms] ease-[cubic-bezier(0.32,0.72,0,1)]",
            "hover:-translate-y-0.5 hover:shadow-sm active:scale-[0.99]",
          )}
        >
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
            <FileText className="size-5" aria-hidden />
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="font-display text-lg text-foreground">
                {visit.doctorName}
              </p>
              <time
                dateTime={visit.appointmentDate}
                className="text-xs text-muted-foreground"
              >
                {formatVisitDate(visit.appointmentDate)}
              </time>
            </div>
            <p className="text-xs text-muted-foreground">
              {t("childLabel", { name: visit.childFirstName })}
            </p>
            <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
              {visit.summaryPreview}
            </p>
            {visit.hasPdf ? (
              <span className="inline-flex rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                {t("pdfBadge")}
              </span>
            ) : null}
          </div>
        </Link>
      ))}
    </div>
  );
}
