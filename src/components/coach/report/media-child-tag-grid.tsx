"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import type { MediaRosterChild } from "@/lib/reports/media-types";

type MediaChildTagGridProps = {
  children: MediaRosterChild[];
  selectedIds: string[];
  onChange: (childIds: string[]) => void;
  disabled?: boolean;
};

export function MediaChildTagGrid({
  children,
  selectedIds,
  onChange,
  disabled = false,
}: MediaChildTagGridProps) {
  const toggle = (childId: string) => {
    if (disabled) return;
    const next = selectedIds.includes(childId)
      ? selectedIds.filter((id) => id !== childId)
      : [...selectedIds, childId];
    onChange(next);
  };

  return (
    <div className="flex flex-wrap gap-2">
      {children.map((child) => {
        const selected = selectedIds.includes(child.childId);
        return (
          <button
            key={child.childId}
            type="button"
            disabled={disabled}
            onClick={() => toggle(child.childId)}
            className={cn(
              "inline-flex min-h-10 items-center gap-2 rounded-full py-1.5 pl-1.5 pr-3 text-sm transition-[transform,background-color,color] duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.96] motion-reduce:transition-none",
              selected
                ? "bg-primary text-primary-foreground"
                : "bg-card text-muted-foreground ring-1 ring-border/60 hover:text-foreground",
              selected && "motion-safe:animate-[tag-bounce_280ms_ease-out]",
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
        );
      })}
    </div>
  );
}
