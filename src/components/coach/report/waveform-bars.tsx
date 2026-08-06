"use client";

import { cn } from "@/lib/utils";

type WaveformBarsProps = {
  levels: number[];
  active?: boolean;
  className?: string;
};

export function WaveformBars({ levels, active = false, className }: WaveformBarsProps) {
  return (
    <div
      className={cn(
        "flex h-20 items-end justify-center gap-[3px] px-4",
        className,
      )}
      aria-hidden
    >
      {levels.map((level, index) => (
        <span
          key={index}
          className={cn(
            "w-[3px] rounded-full transition-[height,background-color] duration-100 ease-out",
            active ? "bg-primary" : "bg-muted-foreground/30",
          )}
          style={{
            height: `${Math.max(8, Math.round(level * 72))}px`,
          }}
        />
      ))}
    </div>
  );
}
