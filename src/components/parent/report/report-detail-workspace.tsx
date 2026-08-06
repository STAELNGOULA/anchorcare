"use client";

import Link from "next/link";
import { ArrowLeft, CalendarDays, MessageCircle, Share2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { ReportPhotoGrid } from "@/components/parent/report/report-photo-grid";
import { ReportTranscriptAccordion } from "@/components/parent/report/report-transcript-accordion";
import type { ReportDetailPayload } from "@/lib/parent/report-detail-types";
import { cn } from "@/lib/utils";

type ReportDetailWorkspaceProps = {
  detail: ReportDetailPayload;
  shareMode: boolean;
};

function formatReportDate(isoDate: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(new Date(`${isoDate}T12:00:00`));
  } catch {
    return isoDate;
  }
}

export function ReportDetailWorkspace({
  detail,
  shareMode,
}: ReportDetailWorkspaceProps) {
  const t = useTranslations("parent.today.detail");
  const [visible, setVisible] = useState(false);
  const displayName = detail.childLastName
    ? `${detail.childFirstName} ${detail.childLastName}`
    : detail.childFirstName;

  useEffect(() => {
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) {
      setVisible(true);
      return;
    }
    const timer = window.setTimeout(() => setVisible(true), 40);
    return () => window.clearTimeout(timer);
  }, []);

  const shareHref = `/parent/today/${detail.childId}/${detail.dailyReportId}?share=1`;

  return (
    <div
      className={cn(
        "mx-auto max-w-2xl space-y-8 pb-12 transition-opacity duration-500 ease-out",
        visible ? "opacity-100" : "opacity-0",
      )}
    >
      {!shareMode ? (
        <Link
          href={`/parent/today?childId=${detail.childId}`}
          className="inline-flex min-h-11 items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden />
          {t("backToToday")}
        </Link>
      ) : null}

      {shareMode ? (
        <p className="rounded-[1rem] bg-muted/40 px-4 py-3 text-xs text-muted-foreground ring-1 ring-border/40">
          {t("shareBanner")}
        </p>
      ) : null}

      <header className="space-y-3">
        <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
          <CalendarDays className="size-3.5" aria-hidden />
          {formatReportDate(detail.reportDate)}
        </p>
        <h1 className="font-display text-3xl text-foreground md:text-4xl">
          {t("title", { name: displayName })}
        </h1>
        <p className="text-sm text-muted-foreground">
          {detail.orgName}
          <span aria-hidden> · </span>
          {detail.programName}
        </p>
        {detail.coachName && !shareMode ? (
          <p className="text-xs text-muted-foreground">
            {t("coachBy", { name: detail.coachName })}
          </p>
        ) : null}
        {detail.amendedAt ? (
          <p className="text-xs text-amber-700 dark:text-amber-400">
            {t("amendedNotice", {
              date: formatReportDate(detail.amendedAt.slice(0, 10)),
            })}
          </p>
        ) : null}
      </header>

      <article
        className="rounded-[1.25rem] bg-card p-6 ring-1 ring-border/50"
        style={{ borderTopColor: `${detail.orgAccentColor}33` }}
      >
        <p className="text-[1.125rem] leading-relaxed text-foreground/95">
          {detail.reportBody || t("emptyBody")}
        </p>
      </article>

      {detail.coachNotes && !shareMode ? (
        <section className="space-y-2">
          <h2 className="text-sm font-medium text-foreground">
            {t("coachNotesTitle")}
          </h2>
          <p className="rounded-[1.25rem] bg-muted/30 px-5 py-4 text-sm leading-relaxed text-foreground/90 ring-1 ring-border/40">
            {detail.coachNotes}
          </p>
        </section>
      ) : null}

      {detail.transcript ? (
        <ReportTranscriptAccordion transcript={detail.transcript} />
      ) : null}

      <ReportPhotoGrid photos={detail.photos} photoCount={detail.photoCount} />

      {!shareMode ? (
        <div className="flex flex-col gap-3 border-t border-border/50 pt-8 sm:flex-row">
          <Link
            href={`/parent/messages?program=${detail.programId}`}
            className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full bg-foreground px-5 text-sm font-medium text-background transition-transform duration-200 ease-out active:scale-[0.98]"
          >
            <MessageCircle className="size-4" aria-hidden />
            {t("messageProgram")}
          </Link>
          <Link
            href={`/parent/timeline?childId=${detail.childId}`}
            className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full px-5 text-sm font-medium ring-1 ring-border/60 transition-colors hover:bg-muted/40"
          >
            <CalendarDays className="size-4" aria-hidden />
            {t("viewTimeline")}
          </Link>
          <Link
            href={shareHref}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-5 text-sm font-medium text-muted-foreground ring-1 ring-border/60 transition-colors hover:bg-muted/40 sm:min-w-[3rem] sm:px-4"
            aria-label={t("shareAria")}
          >
            <Share2 className="size-4" aria-hidden />
            <span className="sm:sr-only">{t("share")}</span>
          </Link>
        </div>
      ) : null}
    </div>
  );
}
