"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { BezelCard } from "@/components/marketing/bezel-card";
import { PremiumCta } from "@/components/marketing/premium-cta";
import { TimelineChildSelector } from "@/components/parent/timeline/timeline-child-selector";
import { groupEventsByDay } from "@/components/parent/timeline/timeline-day-groups";
import { TimelineEventCard } from "@/components/parent/timeline/timeline-event-card";
import { TimelineFilterChips } from "@/components/parent/timeline/timeline-filter-chips";
import { TimelineSkeleton } from "@/components/parent/timeline/timeline-skeleton";
import type { TimelineFilter } from "@/lib/parent/timeline-constants";
import { TIMELINE_PREFETCH_THRESHOLD } from "@/lib/parent/timeline-constants";
import type { TimelinePage } from "@/lib/parent/timeline-types";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type ParentTimelineWorkspaceProps = {
  initialPage: TimelinePage;
  initialChildId?: string;
  initialFilter?: TimelineFilter;
};

async function fetchTimelinePage({
  childId,
  filter,
  cursor,
}: {
  childId: string | null;
  filter: TimelineFilter;
  cursor?: string;
}): Promise<TimelinePage> {
  const params = new URLSearchParams();
  if (childId) params.set("childId", childId);
  if (filter !== "all") params.set("filter", filter);
  if (cursor) params.set("cursor", cursor);

  const res = await fetch(`/api/parent/timeline?${params.toString()}`);
  if (!res.ok) throw new Error("Failed to load timeline");
  const body = (await res.json()) as { page: TimelinePage };
  return body.page;
}

export function ParentTimelineWorkspace({
  initialPage,
  initialChildId,
  initialFilter = "all",
}: ParentTimelineWorkspaceProps) {
  const t = useTranslations("parent.timeline");
  const searchParams = useSearchParams();
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const [newEventIds, setNewEventIds] = useState<Set<string>>(new Set());

  const [selectedChildId, setSelectedChildId] = useState<string | null>(
    initialChildId ?? initialPage.childId ?? null,
  );
  const [filter, setFilter] = useState<TimelineFilter>(initialFilter);

  useEffect(() => {
    const childParam = searchParams.get("childId");
    const filterParam = searchParams.get("filter") as TimelineFilter | null;
    if (childParam) setSelectedChildId(childParam);
    if (
      filterParam &&
      ["all", "reports", "photos", "incidents", "care"].includes(filterParam)
    ) {
      setFilter(filterParam);
    }
  }, [searchParams]);

  const queryKey = ["parent-timeline", selectedChildId, filter] as const;

  const isInitialQuery =
    selectedChildId === (initialChildId ?? initialPage.childId ?? null) &&
    filter === initialFilter;

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch,
  } = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam }) =>
      fetchTimelinePage({
        childId: selectedChildId,
        filter,
        cursor: pageParam as string | undefined,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialData: isInitialQuery
      ? { pages: [initialPage], pageParams: [undefined] }
      : undefined,
    staleTime: 60_000,
  });

  const firstPage = data?.pages[0] ?? initialPage;
  const allEvents = useMemo(
    () => data?.pages.flatMap((p) => p.events) ?? [],
    [data?.pages],
  );

  const dayGroups = useMemo(() => groupEventsByDay(allEvents), [allEvents]);
  const showChildName = selectedChildId === null && firstPage.children.length > 1;

  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting) return;
        const ratio = entry.intersectionRatio;
        if (ratio >= TIMELINE_PREFETCH_THRESHOLD || entry.isIntersecting) {
          loadMore();
        }
      },
      { root: null, rootMargin: "200px", threshold: [0, 0.5, 1] },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore, dayGroups.length]);

  useEffect(() => {
    const childIds = firstPage.children.map((c) => c.id);
    if (childIds.length === 0) return;

    const supabase = createClient();
    const channel = supabase.channel(`timeline-parent-${childIds[0]}`);

    const onInsert = (payload: { new: { child_id?: string; id?: string } }) => {
      const row = payload.new;
      if (!row.child_id || !childIds.includes(row.child_id)) return;
      if (selectedChildId && row.child_id !== selectedChildId) return;
      void refetch().then((result) => {
        const fresh = result.data?.pages[0]?.events[0];
        if (fresh) {
          setNewEventIds((prev) => new Set(prev).add(fresh.id));
        }
      });
    };

    channel.on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "timeline_events" },
      onInsert,
    );
    void channel.subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [firstPage.children, refetch, selectedChildId]);

  const handleChildChange = (childId: string | null) => {
    setSelectedChildId(childId);
    setNewEventIds(new Set());
  };

  const handleFilterChange = (next: TimelineFilter) => {
    setFilter(next);
    setNewEventIds(new Set());
  };

  if (firstPage.children.length === 0) {
    return (
      <BezelCard className="flex flex-col items-start gap-4 p-8 md:p-10">
        <div className="space-y-2">
          <h2 className="font-display text-2xl text-foreground">
            {t("emptyTitle")}
          </h2>
          <p className="max-w-lg text-sm leading-relaxed text-muted-foreground">
            {t("emptyBody")}
          </p>
        </div>
        <PremiumCta href="/parent/family/children" showArrow={false}>
          {t("emptyCta")}
        </PremiumCta>
      </BezelCard>
    );
  }

  return (
    <div className="space-y-6">
      <TimelineChildSelector
        children={firstPage.children}
        selectedChildId={selectedChildId}
        onSelect={handleChildChange}
      />

      <TimelineFilterChips value={filter} onChange={handleFilterChange} />

      {firstPage.plan === "free" ? (
        <p className="text-xs text-muted-foreground">{t("freeWindowHint")}</p>
      ) : null}

      {isLoading ? <TimelineSkeleton /> : null}

      {isError ? (
        <BezelCard className="p-6 text-center">
          <p className="text-sm text-muted-foreground">{t("errorLoad")}</p>
          <button
            type="button"
            onClick={() => void refetch()}
            className="mt-4 min-h-10 rounded-full bg-foreground px-5 text-sm text-background"
          >
            {t("retry")}
          </button>
        </BezelCard>
      ) : null}

      {!isLoading && !isError && allEvents.length === 0 ? (
        <BezelCard className="p-8 md:p-10">
          <h2 className="font-display text-xl text-foreground">
            {t("filterEmptyTitle")}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("filterEmptyBody")}
          </p>
        </BezelCard>
      ) : null}

      <div className="space-y-8">
        {dayGroups.map((group) => (
          <section key={group.dayKey} aria-labelledby={`day-${group.dayKey}`}>
            <h2
              id={`day-${group.dayKey}`}
              className="mb-4 text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground"
            >
              {group.dayLabel}
            </h2>
            <div className="space-y-3">
              {group.events.map((event) => (
                <TimelineEventCard
                  key={event.id}
                  event={event}
                  showChildName={showChildName}
                  animateIn={newEventIds.has(event.id)}
                />
              ))}
            </div>
          </section>
        ))}
      </div>

      <div
        ref={sentinelRef}
        className={cn(
          "flex justify-center py-6 text-xs text-muted-foreground",
          !hasNextPage && "hidden",
        )}
        aria-hidden={!hasNextPage}
      >
        {isFetchingNextPage ? t("loadingMore") : t("scrollForMore")}
      </div>
    </div>
  );
}
