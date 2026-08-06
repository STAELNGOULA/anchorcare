"use client";

import Image from "next/image";
import Link from "next/link";
import {
  AlertTriangle,
  Camera,
  ClipboardList,
  FileText,
  Lock,
  StickyNote,
} from "lucide-react";
import { useTranslations } from "next-intl";
import type { TimelineEventItem } from "@/lib/parent/timeline-types";
import { cn } from "@/lib/utils";

type TimelineEventCardProps = {
  event: TimelineEventItem;
  showChildName: boolean;
  animateIn?: boolean;
};

function EventIcon({ type }: { type: TimelineEventItem["eventType"] }) {
  const className = "size-4 shrink-0";
  switch (type) {
    case "daily_report":
      return <FileText className={className} aria-hidden />;
    case "photo":
      return <Camera className={className} aria-hidden />;
    case "incident":
      return <AlertTriangle className={className} aria-hidden />;
    case "registration":
      return <ClipboardList className={className} aria-hidden />;
    case "note":
      return <StickyNote className={className} aria-hidden />;
    default:
      return <FileText className={className} aria-hidden />;
  }
}

function iconTone(type: TimelineEventItem["eventType"]): string {
  switch (type) {
    case "incident":
      return "bg-destructive/10 text-destructive";
    case "photo":
      return "bg-sky-500/10 text-sky-600 dark:text-sky-400";
    case "registration":
      return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
    default:
      return "bg-muted text-muted-foreground";
  }
}

export function TimelineEventCard({
  event,
  showChildName,
  animateIn = false,
}: TimelineEventCardProps) {
  const t = useTranslations("parent.timeline");

  const meta = [event.programName, event.orgName].filter(Boolean).join(" · ");
  const timeLabel = new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(event.occurredAt));

  const inner = (
    <article
      className={cn(
        "relative rounded-[1.25rem] bg-card p-5 ring-1 ring-border/50 transition-[transform,box-shadow] duration-[220ms] ease-[cubic-bezier(0.32,0.72,0,1)]",
        animateIn &&
          "motion-safe:animate-in motion-safe:slide-in-from-top-3 motion-safe:fade-in motion-safe:duration-300",
        event.locked && "overflow-hidden",
        !event.locked && event.href && "hover:-translate-y-0.5",
      )}
    >
      {event.locked ? (
        <div
          className="pointer-events-none absolute inset-0 z-10 backdrop-blur-md"
          aria-hidden
        />
      ) : null}

      <div className="flex items-start gap-4">
        <div
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-xl",
            iconTone(event.eventType),
          )}
        >
          {event.locked ? (
            <Lock className="size-4" aria-hidden />
          ) : (
            <EventIcon type={event.eventType} />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h3
              className={cn(
                "font-medium text-foreground",
                event.locked && "select-none blur-[3px]",
              )}
            >
              {event.locked ? t("lockedTitle") : event.title}
            </h3>
            <span className="text-xs text-muted-foreground">{timeLabel}</span>
          </div>

          {showChildName ? (
            <p className="mt-0.5 text-xs text-muted-foreground">
              {event.childFirstName}
            </p>
          ) : null}

          {meta ? (
            <p className="mt-1 text-xs text-muted-foreground">{meta}</p>
          ) : null}

          {!event.locked && event.summary ? (
            <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-foreground/90">
              {event.summary}
            </p>
          ) : null}

          {event.locked ? (
            <p className="relative z-20 mt-3 text-sm text-muted-foreground">
              {t("lockedBody")}
            </p>
          ) : null}
        </div>
      </div>

      {event.locked ? (
        <Link
          href="/parent/you/subscription"
          className="relative z-20 mt-4 inline-flex min-h-10 items-center rounded-full bg-foreground px-4 text-xs font-medium text-background transition-transform duration-200 ease-out active:scale-[0.98]"
        >
          {t("lockedCta")}
        </Link>
      ) : null}
    </article>
  );

  if (!event.locked && event.href) {
    return (
      <Link
        href={event.href}
        className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-[1.25rem]"
      >
        {inner}
      </Link>
    );
  }

  return inner;
}
