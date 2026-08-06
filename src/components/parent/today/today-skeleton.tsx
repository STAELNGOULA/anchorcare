"use client";

import type { ParentTodayFeed } from "@/lib/parent/today-types";

export function TodaySkeleton() {
  return (
    <div className="space-y-4" aria-hidden>
      {Array.from({ length: 2 }).map((_, index) => (
        <div
          key={index}
          className="animate-pulse rounded-[1.25rem] bg-card p-5 ring-1 ring-border/50"
        >
          <div className="flex gap-4">
            <div className="size-14 shrink-0 rounded-full bg-muted" />
            <div className="min-w-0 flex-1 space-y-3">
              <div className="h-5 w-32 rounded bg-muted" />
              <div className="h-4 w-24 rounded bg-muted" />
              <div className="h-16 w-full rounded-[0.875rem] bg-muted/70" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function TodaySkeletonMirror({ count }: { count: number }) {
  return (
    <div className="space-y-4" aria-hidden>
      {Array.from({ length: Math.max(1, count) }).map((_, index) => (
        <div
          key={index}
          className="rounded-[1.25rem] bg-card p-5 ring-1 ring-border/50"
        >
          <div className="flex gap-4">
            <div className="size-14 shrink-0 rounded-full bg-muted/60" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-4 w-28 rounded bg-muted/60" />
              <div className="h-3 w-20 rounded bg-muted/40" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export type { ParentTodayFeed };
