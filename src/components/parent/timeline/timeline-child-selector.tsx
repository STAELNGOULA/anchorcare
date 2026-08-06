"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import type { TimelineChildOption } from "@/lib/parent/timeline-types";
import { cn } from "@/lib/utils";

type TimelineChildSelectorProps = {
  children: TimelineChildOption[];
  selectedChildId: string | null;
  onSelect: (childId: string | null) => void;
};

export function TimelineChildSelector({
  children,
  selectedChildId,
  onSelect,
}: TimelineChildSelectorProps) {
  const t = useTranslations("parent.timeline");

  if (children.length <= 1) return null;

  return (
    <div
      className="flex gap-2 overflow-x-auto pb-1 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      role="tablist"
      aria-label={t("childSelectorLabel")}
    >
      <button
        type="button"
        role="tab"
        aria-selected={selectedChildId === null}
        onClick={() => onSelect(null)}
        className={cn(
          "shrink-0 snap-start rounded-full px-4 py-2.5 text-sm transition-[background-color,color] duration-200 ease-out",
          selectedChildId === null
            ? "bg-foreground text-background"
            : "bg-card text-muted-foreground ring-1 ring-border/60",
        )}
      >
        {t("allChildren")}
      </button>
      {children.map((child) => (
        <button
          key={child.id}
          type="button"
          role="tab"
          aria-selected={selectedChildId === child.id}
          onClick={() => onSelect(child.id)}
          className={cn(
            "flex shrink-0 snap-start items-center gap-2 rounded-full py-2 pl-2 pr-4 text-sm transition-[background-color,color] duration-200 ease-out",
            selectedChildId === child.id
              ? "bg-foreground text-background"
              : "bg-card text-muted-foreground ring-1 ring-border/60",
          )}
        >
          <span className="relative size-7 overflow-hidden rounded-full bg-muted">
            {child.photoSignedUrl ? (
              <Image
                src={child.photoSignedUrl}
                alt=""
                fill
                className="object-cover"
                unoptimized
              />
            ) : (
              <span className="flex size-full items-center justify-center text-xs font-medium">
                {child.firstName.charAt(0)}
              </span>
            )}
          </span>
          {child.firstName}
        </button>
      ))}
    </div>
  );
}
