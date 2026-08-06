"use client";

import { useTranslations } from "next-intl";
import type { TimelineFilter } from "@/lib/parent/timeline-constants";
import { cn } from "@/lib/utils";

const FILTERS: TimelineFilter[] = [
  "all",
  "reports",
  "photos",
  "incidents",
  "care",
];

type TimelineFilterChipsProps = {
  value: TimelineFilter;
  onChange: (filter: TimelineFilter) => void;
};

export function TimelineFilterChips({
  value,
  onChange,
}: TimelineFilterChipsProps) {
  const t = useTranslations("parent.timeline.filters");

  return (
    <div
      className="flex gap-2 overflow-x-auto pb-1 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      role="tablist"
      aria-label={t("label")}
    >
      {FILTERS.map((filter) => (
        <button
          key={filter}
          type="button"
          role="tab"
          aria-selected={value === filter}
          onClick={() => onChange(filter)}
          className={cn(
            "shrink-0 snap-start rounded-full px-4 py-2 text-sm font-medium transition-[background-color,color] duration-200 ease-out",
            value === filter
              ? "bg-primary/12 text-primary"
              : "bg-card text-muted-foreground ring-1 ring-border/60 hover:text-foreground",
          )}
        >
          {t(filter)}
        </button>
      ))}
    </div>
  );
}
