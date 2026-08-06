"use client";

import Image from "next/image";
import Link from "next/link";
import { AlertTriangle, Camera, ChevronRight, Clock } from "lucide-react";
import { useTranslations } from "next-intl";
import type { TodayChildCard } from "@/lib/parent/today-types";
import { cn } from "@/lib/utils";

type TodayChildCardProps = {
  card: TodayChildCard;
  index: number;
  highlighted?: boolean;
  onOpenReport?: (card: TodayChildCard) => void;
};

function reportHref(card: TodayChildCard): string | null {
  if (!card.latestReport) return null;
  const reportId =
    card.latestReport.dailyReportId ?? card.latestReport.eventId;
  return `/parent/today/${card.childId}/${reportId}`;
}

export function TodayChildCardView({
  card,
  index,
  highlighted = false,
  onOpenReport,
}: TodayChildCardProps) {
  const t = useTranslations("parent.today");
  const displayName = `${card.firstName} ${card.lastName}`.trim();
  const href = reportHref(card);
  const showIncident = Boolean(card.incidentAlert);
  const showPickupEta = Boolean(card.pickupEta) && !showIncident;

  const formatEtaTime = (iso: string) =>
    new Intl.DateTimeFormat(undefined, {
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(iso));

  const inner = (
    <article
      className={cn(
        "rounded-[1.25rem] bg-card p-5 ring-1 transition-[transform,box-shadow] duration-[220ms] ease-[cubic-bezier(0.32,0.72,0,1)] motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2",
        highlighted
          ? "ring-primary/50 shadow-[0_0_0_1px_hsl(var(--primary)/0.25)]"
          : "ring-border/50",
        href && "hover:-translate-y-0.5",
      )}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {showIncident ? (
        <div className="mb-4">
          {card.incidentAlert?.incidentId ? (
            <Link
              href={`/parent/incidents/${card.incidentAlert.incidentId}`}
              className="flex items-start gap-2 rounded-[0.875rem] bg-destructive/10 px-3 py-2.5 motion-safe:animate-in motion-safe:slide-in-from-top-2 motion-safe:duration-300 transition-[transform] duration-[220ms] ease-out hover:bg-destructive/15 active:scale-[0.99]"
            >
              <AlertTriangle
                className="mt-0.5 size-4 shrink-0 text-destructive"
                aria-hidden
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-destructive">
                  {card.incidentAlert.title ?? t("incident.defaultTitle")}
                </p>
                {card.incidentAlert.summary ? (
                  <p className="mt-0.5 line-clamp-2 text-xs text-destructive/90">
                    {card.incidentAlert.summary}
                  </p>
                ) : null}
              </div>
              <ChevronRight className="size-4 shrink-0 text-destructive/70" aria-hidden />
            </Link>
          ) : (
            <div className="flex items-start gap-2 rounded-[0.875rem] bg-destructive/10 px-3 py-2.5 motion-safe:animate-in motion-safe:slide-in-from-top-2 motion-safe:duration-300">
              <AlertTriangle
                className="mt-0.5 size-4 shrink-0 text-destructive"
                aria-hidden
              />
              <div className="min-w-0">
                <p className="text-sm font-medium text-destructive">
                  {card.incidentAlert?.title ?? t("incident.defaultTitle")}
                </p>
                {card.incidentAlert?.summary ? (
                  <p className="mt-0.5 line-clamp-2 text-xs text-destructive/90">
                    {card.incidentAlert.summary}
                  </p>
                ) : null}
              </div>
            </div>
          )}
        </div>
      ) : null}

      {showPickupEta && card.pickupEta ? (
        <div className="mb-4 flex items-start gap-2 rounded-[0.875rem] border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 motion-safe:animate-in motion-safe:slide-in-from-top-2 motion-safe:duration-300">
          <Clock
            className="mt-0.5 size-4 shrink-0 text-amber-700 dark:text-amber-200"
            aria-hidden
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-amber-950 dark:text-amber-50">
              {t("pickupEta.title", {
                time: formatEtaTime(card.pickupEta.expectedAt),
              })}
            </p>
            {card.pickupEta.note ? (
              <p className="mt-0.5 line-clamp-2 text-xs text-amber-900/80 dark:text-amber-100/80">
                {card.pickupEta.note}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="flex items-start gap-4">
        <div className="relative size-14 shrink-0 overflow-hidden rounded-full bg-muted">
          {card.photoSignedUrl ? (
            <Image
              src={card.photoSignedUrl}
              alt=""
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <span className="flex size-full items-center justify-center text-lg font-medium text-muted-foreground">
              {card.firstName.charAt(0)}
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display text-lg text-foreground">{displayName}</h3>
            {card.isNew ? (
              <span className="rounded-full bg-primary/12 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-primary">
                {t("newBadge")}
              </span>
            ) : null}
          </div>

          {card.programName ? (
            <p className="mt-0.5 text-sm text-muted-foreground">{card.programName}</p>
          ) : (
            <p className="mt-0.5 text-sm text-muted-foreground">
              {t("noProgramOnChild")}
            </p>
          )}

          {!showIncident && card.latestReport?.summary ? (
            <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-foreground/90">
              {card.latestReport.summary}
            </p>
          ) : null}

          {!showIncident && card.waitingForFirstReport ? (
            <p className="mt-3 text-sm text-muted-foreground">{t("waitingFirstReport")}</p>
          ) : null}

          {card.latestReport && card.latestReport.photoCount > 0 ? (
            <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <Camera className="size-3.5" aria-hidden />
              {t("photoCount", { count: card.latestReport.photoCount })}
            </p>
          ) : null}
        </div>

        {href ? (
          <ChevronRight
            className="size-5 shrink-0 text-muted-foreground"
            aria-hidden
          />
        ) : null}
      </div>
    </article>
  );

  if (!href) return inner;

  return (
    <Link
      href={href}
      onClick={() => onOpenReport?.(card)}
      className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-[1.25rem]"
    >
      {inner}
    </Link>
  );
}
