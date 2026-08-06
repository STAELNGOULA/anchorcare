"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { FileWarning } from "lucide-react";
import { BezelCard } from "@/components/marketing/bezel-card";
import { PremiumCta } from "@/components/marketing/premium-cta";
import { MorningHealthModal } from "@/components/parent/today/morning-health-modal";
import { RunningLateModal } from "@/components/parent/today/running-late-modal";
import { TodayChildCardView } from "@/components/parent/today/today-child-card";
import { TodayQuickLinks } from "@/components/parent/today/today-quick-links";
import { TodaySkeleton } from "@/components/parent/today/today-skeleton";
import { usePullToRefresh } from "@/components/parent/today/use-pull-to-refresh";
import type { ParentContext } from "@/lib/parent/parent-context";
import type { ParentTodayFeed, TodayChildCard } from "@/lib/parent/today-types";
import { cn } from "@/lib/utils";

type ParentTodayWorkspaceProps = {
  context: Pick<
    ParentContext,
    "hasLinkedProgram" | "childrenCount" | "displayName"
  >;
  initialFeed: ParentTodayFeed;
  focusChildId?: string;
};

async function fetchTodayFeed(): Promise<ParentTodayFeed> {
  const res = await fetch("/api/parent/today");
  if (!res.ok) throw new Error("Failed to load today feed");
  const body = (await res.json()) as { feed: ParentTodayFeed };
  return body.feed;
}

async function recordEngagement(payload: {
  eventType: "today_visit" | "report_open";
  childId?: string;
  timelineEventId?: string;
}) {
  await fetch("/api/parent/today/engagement", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function ParentTodayWorkspace({
  context,
  initialFeed,
  focusChildId,
}: ParentTodayWorkspaceProps) {
  const t = useTranslations("parent.today");
  const visitRecorded = useRef(false);
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [runningLateOpen, setRunningLateOpen] = useState(false);
  const [morningHealthOpen, setMorningHealthOpen] = useState(false);

  const { data: feed, isFetching, refetch } = useQuery({
    queryKey: ["parent-today"],
    queryFn: fetchTodayFeed,
    initialData: initialFeed,
    staleTime: 60_000,
  });

  const refresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const { pulling, pullDistance, pullHandlers } = usePullToRefresh({
    onRefresh: refresh,
  });

  useEffect(() => {
    if (visitRecorded.current) return;
    visitRecorded.current = true;
    void recordEngagement({ eventType: "today_visit" });
  }, []);

  useEffect(() => {
    if (!focusChildId) return;
    const el = cardRefs.current[focusChildId];
    if (!el) return;
    const timer = window.setTimeout(() => {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 120);
    return () => window.clearTimeout(timer);
  }, [focusChildId, feed?.children.length]);

  const handleOpenReport = useCallback((card: TodayChildCard) => {
    if (!card.latestReport) return;
    void recordEngagement({
      eventType: "report_open",
      childId: card.childId,
      timelineEventId: card.latestReport.eventId,
    });
  }, []);

  const showChildPicker = (feed?.children.length ?? 0) > 3;

  const sortedChildren = useMemo(() => {
    if (!feed?.children) return [];
    if (!focusChildId) return feed.children;
    const focused = feed.children.find((c) => c.childId === focusChildId);
    const rest = feed.children.filter((c) => c.childId !== focusChildId);
    return focused ? [focused, ...rest] : feed.children;
  }, [feed?.children, focusChildId]);

  if (!context.hasLinkedProgram && context.childrenCount === 0) {
    return (
      <BezelCard className="flex flex-col items-start gap-4 p-8 md:p-10">
        <div className="space-y-2">
          <h2 className="font-display text-2xl text-foreground">
            {t("noProgramTitle")}
          </h2>
          <p className="max-w-lg text-sm leading-relaxed text-muted-foreground">
            {t("noProgramBody")}
          </p>
        </div>
        <PremiumCta href="/connect" showArrow={false}>
          {t("noProgramCta")}
        </PremiumCta>
      </BezelCard>
    );
  }

  return (
    <div className="space-y-6" {...pullHandlers}>
      {(pullDistance > 0 || pulling) && (
        <div
          className="flex justify-center text-xs text-muted-foreground transition-opacity duration-200"
          style={{ opacity: Math.min(1, pullDistance / 72) }}
        >
          {pulling ? t("refreshing") : t("pullToRefresh")}
        </div>
      )}

      <header className="space-y-1">
        <p className="text-sm text-muted-foreground">{feed?.dateLabel}</p>
        <TodayQuickLinks
          onRunningLate={() => setRunningLateOpen(true)}
          onMorningHealth={() => setMorningHealthOpen(true)}
        />
      </header>

      {feed?.formExpiryAlerts && feed.formExpiryAlerts.length > 0 ? (
        <Link
          href="/parent/you/forms"
          className="flex items-start gap-3 rounded-[1rem] border border-border/60 bg-card px-4 py-3 transition-[transform,background-color] duration-200 ease-out hover:bg-muted/30 active:scale-[0.99]"
        >
          <FileWarning className="mt-0.5 size-4 shrink-0 text-amber-600" aria-hidden />
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground">
              {t("formExpiry.title", { count: feed.formExpiryAlerts.length })}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {t("formExpiry.body", {
                title: feed.formExpiryAlerts[0]?.title ?? "",
                days: feed.formExpiryAlerts[0]?.daysUntil ?? 0,
              })}
            </p>
          </div>
        </Link>
      ) : null}

      {isFetching && !feed ? <TodaySkeleton /> : null}

      {feed && sortedChildren.length === 0 ? (
        <BezelCard className="p-8 md:p-10">
          <h2 className="font-display text-2xl text-foreground">
            {t("noChildrenTitle")}
          </h2>
          <p className="mt-2 max-w-lg text-sm text-muted-foreground">
            {t("noChildrenBody")}
          </p>
        </BezelCard>
      ) : null}

      {showChildPicker ? (
        <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {sortedChildren.map((child) => (
            <button
              key={child.childId}
              type="button"
              onClick={() => {
                cardRefs.current[child.childId]?.scrollIntoView({
                  behavior: "smooth",
                  block: "center",
                });
              }}
              className={cn(
                "shrink-0 rounded-full px-4 py-2 text-sm transition-[background-color,color] duration-200 ease-out",
                focusChildId === child.childId
                  ? "bg-foreground text-background"
                  : "bg-card text-muted-foreground ring-1 ring-border/60",
              )}
            >
              {child.firstName}
            </button>
          ))}
        </div>
      ) : null}

      <div
        className={cn(
          "gap-4",
          sortedChildren.length > 3
            ? "flex snap-x snap-mandatory overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            : "grid md:grid-cols-2",
        )}
      >
        {sortedChildren.map((card, index) => (
          <div
            key={card.childId}
            ref={(node) => {
              cardRefs.current[card.childId] = node;
            }}
            className={cn(
              sortedChildren.length > 3 &&
                "w-[min(88vw,22rem)] shrink-0 snap-center",
            )}
          >
            <TodayChildCardView
              card={card}
              index={index}
              highlighted={focusChildId === card.childId}
              onOpenReport={handleOpenReport}
            />
          </div>
        ))}
      </div>

      <RunningLateModal
        open={runningLateOpen}
        onOpenChange={setRunningLateOpen}
        children={feed?.children ?? []}
        onSuccess={() => void refetch()}
      />

      <MorningHealthModal
        open={morningHealthOpen}
        onOpenChange={setMorningHealthOpen}
        children={feed?.children ?? []}
        onSuccess={() => void refetch()}
      />
    </div>
  );
}
