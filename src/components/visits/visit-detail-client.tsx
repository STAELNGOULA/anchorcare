"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowLeft, Download, Share2 } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { SkeletonList } from "@/components/shared/skeleton-list";
import type { VisitReportDetail } from "@/lib/visits/visit-types";
import { cn } from "@/lib/utils";

type VisitDetailClientProps = {
  visitId: string;
};

function formatVisitDate(isoDate: string): string {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${isoDate}T12:00:00`));
}

export function VisitDetailClient({ visitId }: VisitDetailClientProps) {
  const t = useTranslations("parent.care.visits.detail");
  const [visit, setVisit] = useState<VisitReportDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`/api/parent/visits/${visitId}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("load_failed");
      const data = await res.json();
      setVisit(data.visit);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [visitId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <SkeletonList count={1} />;

  if (error || !visit) {
    return (
      <div className="space-y-4">
        <ErrorState title={t("errorTitle")} onRetry={() => void load()} />
        <Link
          href="/parent/care/visits"
          className="inline-flex text-sm text-muted-foreground hover:text-foreground"
        >
          {t("back")}
        </Link>
      </div>
    );
  }

  const clearanceHref = `/parent/care/clearance?childId=${visit.childId}`;

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <Link
        href="/parent/care/visits"
        className="inline-flex min-h-11 items-center gap-2 text-sm text-muted-foreground transition-colors duration-[220ms] ease-out hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden />
        {t("back")}
      </Link>

      <header className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          {t("eyebrow")}
        </p>
        <h1 className="font-display text-3xl text-foreground">{visit.doctorName}</h1>
        <p className="text-muted-foreground">
          {formatVisitDate(visit.appointmentDate)} · {visit.childFirstName}
        </p>
      </header>

      <div className="rounded-[1.25rem] bg-card p-6 ring-1 ring-border/50">
        <h2 className="text-sm font-medium text-foreground">{t("summaryTitle")}</h2>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
          {visit.summary}
        </p>
      </div>

      {visit.pdfSignedUrl ? (
        <div className="space-y-4 rounded-[1.25rem] bg-card p-4 ring-1 ring-border/50">
          <div className="flex flex-wrap items-center justify-between gap-3 px-2 pt-2">
            <h2 className="text-sm font-medium text-foreground">{t("pdfTitle")}</h2>
            <a
              href={visit.pdfSignedUrl}
              download
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "inline-flex min-h-10 items-center gap-2 rounded-full bg-secondary px-4 text-sm font-medium text-foreground",
                "transition-[transform,background-color] duration-[220ms] ease-out hover:bg-secondary/80 active:scale-[0.98]",
              )}
            >
              <Download className="size-4" aria-hidden />
              {t("downloadPdf")}
            </a>
          </div>
          <iframe
            title={t("pdfTitle")}
            src={visit.pdfSignedUrl}
            className="h-[min(70vh,520px)] w-full rounded-xl border border-border/50 bg-background"
          />
        </div>
      ) : (
        <EmptyState
          title={t("noPdfTitle")}
          description={t("noPdfBody")}
          className="p-6"
        />
      )}

      <div className="rounded-[1.25rem] bg-primary/5 p-6 ring-1 ring-primary/15">
        <h2 className="font-display text-lg text-foreground">{t("shareTitle")}</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {t("shareBody")}
        </p>
        <Link
          href={clearanceHref}
          className={cn(
            "mt-4 inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground",
            "transition-[transform,background-color] duration-[220ms] ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-primary/92 active:scale-[0.98]",
          )}
        >
          <Share2 className="size-4" aria-hidden />
          {t("shareCta")}
        </Link>
      </div>
    </div>
  );
}
